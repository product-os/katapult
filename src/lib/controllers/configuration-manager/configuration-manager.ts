import * as inquirer from 'inquirer';
import { Questions } from 'inquirer';
import { ValidationError, Validator } from 'jsonschema';
import { get, keys, reduce, replace } from 'lodash';
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

import { EnvironmentValidator } from '../environment-file/environment-validator';
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
		const { configurationPath, mode = 'interactive' } = args;
		const environment = await new EnvironmentValidator(
			configurationPath,
		).validate();
		const configManifest = await ConfigManifest.create(environment.productRepo);
		const configStore = await ConfigStore.create(environment.configStore);

		const configMap = await configStore.list();
		return new ConfigurationManager({
			configManifest,
			configStore,
			configMap,
			mode,
		});
	}

	private readonly configManifest: ConfigManifest;
	private readonly configMap: ConfigMap;
	private readonly mode: string;
	private configStore: ConfigStore;

	public constructor(args: ConfigurationManagerArgs) {
		const { configManifest, configStore, configMap, mode } = args;
		this.configManifest = configManifest;
		this.configStore = configStore;
		this.configMap = configMap;
		this.mode = mode || 'interactive';
	}

	public async sync() {
		const invalidProperties = this.validateConfigMap();

		const updatedConfig: ConfigMap = {};
		const cmJSONSchema = this.configManifest.JSONSchema();
		for (const name of keys(invalidProperties)) {
			const formula = get(cmJSONSchema, [
				'properties',
				name,
				'default',
				'eval',
			]);

			if (formula) {
				updatedConfig[name] = await this.evalFormula(name, formula);
			} else {
				switch (this.mode) {
					case 'interactive':
					case 'edit': {
						const questions = [
							{
								message: `Please enter value for ${name}`,
								type: 'input',
								name: 'value',
								validate: (value: string) => {
									return this.validateProperty(name, value);
								},
							},
						] as Questions;
						const answers = await inquirer.prompt(questions);
						updatedConfig[name] = answers.value;
						break;
					}
					case 'quiet': {
						throw new Error(invalidProperties[name].message);
					}
					default: {
						throw new Error('Mode not implemented');
					}
				}
			}
			this.configMap[name] = updatedConfig[name];
		}
		if (this.mode === 'edit') {
			// TODO: Invoke configuration interactive editor
		}

		return await this.configStore.updateMany(this.configMap);
	}

	/**
	 * Validates property against this.configManifest
	 * @param {string} name: Property name
	 * @param {string} value: Property value
	 * @returns {boolean}
	 */
	private validateProperty(name: string, value: string): boolean {
		const validator = new Validator();
		const schemaErrors = validator.validate(
			{
				[name]: value,
			},
			{
				type: 'object',
				properties: {
					[name]: get(this.configManifest.JSONSchema(), ['properties', name]),
				},
				required: [name],
			},
		);
		if (schemaErrors.valid) {
			return true;
		}
		throw schemaErrors.errors[0];
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
