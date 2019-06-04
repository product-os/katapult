import { ValidationError, Validator } from 'jsonschema';
import { get, has, keys } from 'lodash';
import { ConfigManifest } from '../config-manifest/config-manifest';
import { ConfigMap } from '../config-store';

interface ConfigValidatorArgs {
	configMap: ConfigMap;
	configManifest: ConfigManifest;
}

export class ConfigValidator {
	private readonly configMap: ConfigMap;
	private readonly configManifest: ConfigManifest;
	private readonly validator: Validator;

	public constructor(args: ConfigValidatorArgs) {
		this.configManifest = args.configManifest;
		this.configMap = args.configMap;
		this.validator = new Validator();
	}

	/**
	 * Validates configurationg against config-manifest JSONSchema,
	 * using jsonschema Validator
	 * @param {boolean} throwErrors: Boolean flag for throwing errors
	 * @returns {ValidationError[]}
	 */
	public validate(throwErrors: boolean): ValidationError[] {
		const cmJSONSchema = this.configManifest.JSONSchema();
		// adapt config value types, according to config-manifest, for validation.
		for (const name of keys(this.configMap)) {
			if (
				has(cmJSONSchema, ['properties', name]) &&
				get(cmJSONSchema, [name, 'type']) === 'number'
			) {
				this.configMap[name] = parseInt(this.configMap[name] as string, 10);
			}
		}
		const errors = this.validator.validate(this.configMap, cmJSONSchema).errors;
		if (throwErrors && errors.length) {
			let errorString = '';
			for (const e of errors) {
				errorString += `${e.toString()}\n`;
			}
			throw new Error(errorString);
		}
		return errors;
	}
}