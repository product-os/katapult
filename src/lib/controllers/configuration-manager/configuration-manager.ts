import { ValidationError, Validator } from 'jsonschema';
import { get, keys, reduce, replace, split, trim } from 'lodash';
import {
	ConfigurationManagerArgs,
	ConfigurationManagerCreateArgs,
	ErrorMap,
} from '.';
import { ConfigManifest } from '../config-manifest/config-manifest';
import { ConfigMap } from '../config-store';
import { ConfigStore } from '../config-store/config-store';
import { ConfigValidator } from '../config-validator';

import {
	base64 as b64encode,
	base64decode as b64decode,
	escape as esc,
} from './filters';

import {
	generateApiKey,
	generateCaCert,
	generateCertChain,
	generateCertificate,
	generateDHParam,
	generateECCertificate,
	generateECKeypair,
	generatePrivateKey,
	generatePublicKey,
	generateTokenauthKeyid,
	getEcPrivateKey,
	getEcPublicKey,
	getSSHPublicKey,
} from './generators';

import { Question, Questions } from 'inquirer';
import * as inquirer from 'inquirer';

const base64 = b64encode;
const base64decode = b64decode;
const escape = esc;
const GENERATE_API_KEY = generateApiKey;
const GENERATE_CA_CERT = generateCaCert;
const GENERATE_CERT = generateCertificate;
const GENERATE_CERT_CHAIN = generateCertChain;
const GENERATE_DH_PARAM = generateDHParam;
const GENERATE_EC_CERTIFICATE = generateECCertificate;
const GENERATE_EC_KEYPAIR = generateECKeypair;
const GENERATE_PRIVATE_KEY = generatePrivateKey;
const GENERATE_PUBLIC_KEY = generatePublicKey;
const GENERATE_TOKENAUTH_KEYID = generateTokenauthKeyid;
const GET_EC_PRIVATE_KEY = getEcPrivateKey;
const GET_EC_PUBLIC_KEY = getEcPublicKey;
const GET_SSH_PUBLIC_KEY = getSSHPublicKey;

export class ConfigurationManager {
	static async create(
		args: ConfigurationManagerCreateArgs,
	): Promise<ConfigurationManager> {
		const {
			configManifest,
			configStore,
			configMap,
			mode = 'interactive',
		} = args;

		return new ConfigurationManager({
			configManifest,
			configStore,
			configMap: configMap || (await configStore.list()),
			mode,
		});
	}

	/**
	 * Validates property against this.configManifest
	 * @param {string[]} jsonSchema: Schema containing property for validation
	 * @param {string} name: Property name
	 * @param {string} value: Property value
	 * @returns {boolean}
	 */
	private static validateProperty({
		jsonSchema,
		name,
		value,
	}: {
		jsonSchema: object;
		name: string;
		value: string;
	}): boolean {
		const validator = new Validator();
		const schemaErrors = validator.validate(
			{
				[name]: value,
			},
			{
				type: 'object',
				properties: {
					[name]: jsonSchema,
				},
				required: [name],
			},
		);
		if (schemaErrors.valid) {
			return true;
		}
		throw schemaErrors.errors[0];
	}

	private readonly configManifest: ConfigManifest;
	private readonly mode: string;
	private configMap: ConfigMap;
	private configStore: ConfigStore;

	public constructor(args: ConfigurationManagerArgs) {
		const { configManifest, configStore, configMap, mode } = args;
		this.configManifest = configManifest;
		this.configStore = configStore;
		this.configMap = configMap;
		this.mode = mode || 'interactive';
	}

	public async inquireProperties({ jsonSchema }: { jsonSchema: object }) {
		const ret: inquirer.Answers = {};
		// Shallow property list inquiring (shallow when validation). This will be replaced by ReconFix.
		// Only a subset of when '==' operator is implemented/used in the current context
		for (const name of keys(get(jsonSchema, 'properties'))) {
			const propertyJsonSchema = get(jsonSchema, ['properties', name]);
			let [dependency, value] = split(get(propertyJsonSchema, 'when'), '==');
			value = trim(value, ' "\'');
			dependency = trim(dependency);
			if (!dependency || get(ret, dependency) === value) {
				const answer = await this.inquire({
					jsonSchema: propertyJsonSchema,
					name,
				});
				if (get(answer, name)) {
					ret[name] = get(answer, name);
				}
			}
		}
		return ret;
	}

	public async inquire({
		jsonSchema,
		name,
	}: {
		jsonSchema: object;
		name: string;
	}): Promise<any> {
		if (get(jsonSchema, 'type') === 'object' && get(jsonSchema, 'properties')) {
			if (!get(jsonSchema, 'required')) {
				const questions = [
					{
						message: `Do you have a ${name}?`,
						type: 'confirm',
						name: 'ask',
					},
				] as Questions;
				const answer = await inquirer.prompt(questions);
				if (!answer['ask']) {
					return {};
				}
			}
			const answers = await this.inquireProperties({ jsonSchema });
			return { [name]: answers };
		} else {
			let question: Question = {};
			if (get(jsonSchema, 'enum')) {
				question = {
					message: get(
						jsonSchema,
						'description',
						`Please enter value for ${name}`,
					),
					type: 'list',
					choices: get(jsonSchema, 'enum'),
					name,
				};
			} else {
				question = {
					message: get(
						jsonSchema,
						'description',
						`Please enter value for ${name}`,
					),
					type: 'input',
					name,
					validate: (value: string) => {
						return ConfigurationManager.validateProperty({
							jsonSchema,
							name,
							value,
						});
					},
				};
			}

			return await inquirer.prompt([question]);
		}
	}

	public async syncProperty({
		jsonSchema,
		validationError,
		name,
	}: {
		jsonSchema: object;
		name: string;
		validationError: object;
	}): Promise<void> {
		const formula = get(jsonSchema, ['properties', name, 'default', 'eval']);

		if (formula) {
			this.configMap[name] = await this.evalFormula(name, formula);
		} else {
			switch (this.mode) {
				case 'interactive':
				case 'edit': {
					// if optional ask;
					const answer = await this.inquire({
						jsonSchema: get(jsonSchema, ['properties', name]),
						name,
					});
					if (get(answer, name)) {
						this.configMap[name] = get(answer, name);
					}
					break;
				}
				case 'quiet': {
					throw new Error(get(validationError, 'message'));
				}
				default: {
					throw new Error('Mode not implemented');
				}
			}
		}
	}

	public async sync(): Promise<ConfigMap> {
		const invalidProperties = this.validateConfigMap();
		const jsonSchema = this.configManifest.JSONSchema();
		for (const name of keys(invalidProperties)) {
			await this.syncProperty({
				jsonSchema,
				name,
				validationError: get(invalidProperties, name),
			});
		}
		if (this.mode === 'edit') {
			// TODO: Invoke configuration interactive editor
		}
		return await this.configStore.updateMany(this.configMap);
	}

	private validateConfigMap(): ErrorMap {
		const errors = new ConfigValidator({
			configMap: this.configMap,
			configManifest: this.configManifest,
		}).validate(false);
		return reduce(
			errors,
			(result: any, e: ValidationError) => {
				result[replace(e.property, /^instance\./g, '')] = e;
				return result;
			},
			{} as ErrorMap,
		);
	}

	private async evalFormula(name: string, formula: string) {
		// tslint:disable-next-line:no-eval
		Object.assign(global, this.configMap);
		// tslint:disable-next-line:no-eval
		const result = await eval(formula.split('\n').join(''));
		// @ts-ignore
		global[name] = result;
		return result;
	}
}
