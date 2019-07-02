/*
Copyright 2019 Balena Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import { ValidationError, Validator } from 'jsonschema';
import * as _ from 'lodash';
import { ConfigManifest } from '../config-manifest/config-manifest';
import { ConfigMap } from '../config-store';

interface ConfigValidatorArgs {
	configMap: ConfigMap;
	configManifest: ConfigManifest;
}

/**
 * ConfigValidator class
 * Used for validating a ConfigMap against a ConfigManifest
 */
export class ConfigValidator {
	private readonly configMap: ConfigMap;
	private readonly configManifest: ConfigManifest;
	private readonly validator: Validator;

	/**
	 * ConfigValidator constructor
	 * @param {ConfigValidatorArgs} args
	 */
	public constructor(args: ConfigValidatorArgs) {
		this.configManifest = args.configManifest;
		this.configMap = args.configMap;
		this.validator = new Validator();
	}

	/**
	 * Validates configuration against config-manifest JSONSchema,
	 * using JsonSchema Validator
	 * @param {boolean} throwErrors: Boolean flag for throwing errors
	 * @returns {ValidationError[]}
	 */
	public validate(throwErrors: boolean): ValidationError[] {
		const cmJSONSchema = this.configManifest.JSONSchema();
		// adapt config value types, according to config-manifest, for validation.
		for (const name of _.keys(this.configMap)) {
			if (
				_.has(cmJSONSchema, ['properties', name]) &&
				_.get(cmJSONSchema, [name, 'type']) === 'number'
			) {
				this.configMap[name] = parseInt(this.configMap[name], 10);
			}
		}
		const errors = this.validator.validate(this.configMap, cmJSONSchema).errors;
		if (throwErrors && errors.length) {
			let errorString = '';
			for (const e of errors) {
				errorString += `${e.toString()}\n`;
			}
			throw new ValidationError(errorString);
		}
		return errors;
	}
}
