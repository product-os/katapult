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
import * as _ from 'lodash';

import { ValidationError } from '../error-types';
import { ConfigManifest } from './config-manifest/config-manifest';
import { ConfigMap } from './config-store/config-store';

interface ConfigValidatorArgs {
	configMap: ConfigMap;
	configManifest: ConfigManifest;
	throwErrors: boolean;
}

/**
 * Validate given config against the config manifest. Any non-optional
 * components that are missing will throw.
 * @param {boolean} throwErrors: Boolean flag for throwing errors
 * @returns {ValidationError[]}
 */
export function validateConfig(
	validatorArgs: ConfigValidatorArgs,
): ValidationError[] {
	// Get the native configManifestSchema
	const configManifestSchema = validatorArgs.configManifest.getConfigManifestSchema();

	// Ensure each property is present in the configMap, if not we add a new error
	// saying what's missing and the schema it should adhere to
	const schemaProperties = configManifestSchema.properties;
	const configMap = validatorArgs.configMap;
	const errors: ValidationError[] = [];
	for (const propertyName in schemaProperties) {
		// We know there's only a single keyname, as the manifest schema is validated
		const configValue = _.get(configMap, propertyName);
		const configType = schemaProperties[propertyName].type;
		// TBD: Add extra checking based on schema types based on propertyName
		if (!configValue && !_.endsWith(configType, '?')) {
			const propertySchema = schemaProperties[propertyName];
			errors.push(
				new ValidationError(
					'Missing property in config map',
					propertyName,
					propertySchema,
				),
			);
		}
	}

	if (validatorArgs.throwErrors) {
		throw errors;
	}

	return errors;
}
