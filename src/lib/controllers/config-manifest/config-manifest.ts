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
import { loadFromUri } from '../../tools';

import * as _ from 'lodash';

/**
 * ConfigManifest class
 * Used for transforming/exposing a config-manifest
 */
export class ConfigManifest {
	/**
	 * Creates ConfigManifest using:
	 * @param {string} productRepoURI
	 * @param {string} path
	 * @returns {Promise<ConfigManifest>}
	 */
	static async create(
		productRepoURI: string,
		path = 'config-manifest.yml',
	): Promise<ConfigManifest> {
		// TODO: support configManifest layering
		let schema;
		schema = await loadFromUri({
			uri: productRepoURI,
			path: path || 'config-manifest.yml',
			errorMessage:
				'Unable to find config-manifest.yml. See documentation_link for more info.\n',
		});
		return new ConfigManifest({ schema });
	}

	/**
	 * Applies when condition to JsonSchema
	 * @param obj
	 * @param {string} key
	 */
	private static applyWhenCondition(obj: any, key: string): void {
		const properties = _.get(obj, key);
		const conditions: any = {};
		const anyOf: any = [];
		_.forIn(properties, function(val, key) {
			if (_.includes(_.get(val, 'when'), '==')) {
				const depArray = _.split(_.get(val, 'when'), '==');
				const dependency = _.trim(depArray[0]);
				const value = _.trim(depArray[1], `'" `);
				if (!_.get(conditions, dependency, false)) {
					conditions[dependency] = { [value]: [key] };
				} else if (_.get(conditions, [dependency, value])) {
					conditions[dependency][value].push(key);
				} else {
					conditions[dependency][value] = [key];
				}
			}
		});

		for (const requirements of _.values(conditions)) {
			for (const requirement of _.values(requirements)) {
				const conditionProperties: any = {};
				for (const name of requirement) {
					conditionProperties[name] = properties[name];
				}
				anyOf.push({
					properties: conditionProperties,
					required: requirement,
				});
			}
		}

		if (anyOf.length) {
			obj['anyOf'] = anyOf;
		}
	}

	/**
	 * Recursively transforms current config-manifest schema format to JSONSchema.
	 * It will be replaced by JellySchema and ReConFix.
	 * @param obj
	 */
	private static traverse(obj: any) {
		// Convert array of properties to object
		_.forIn(obj, function(val, key) {
			if (_.isArray(val) && key === 'properties') {
				obj['properties'] = _.reduce(
					val,
					(o, v) => {
						return _.merge(o, v);
					},
					{},
				);
				ConfigManifest.applyWhenCondition(obj, key);
				obj['additionalProperties'] = true;
			}
		});

		// Add transformations of special syntax
		_.forIn(obj, function(val, key) {
			if (_.isObject(val) && key !== 'anyOf') {
				// Add required as default, unless type ends with '?'
				if (_.endsWith(_.get(val, 'type', ''), '?')) {
					obj[key]['type'] = obj[key]['type'].slice(0, -1);
				} else if (
					!_.includes(['default', 'properties'], key) &&
					!_.get(val, 'when', false)
				) {
					obj[key]['required'] = true;
				}
				// Handle 'hostname', 'email', 'uri' type transformations
				if (
					_.includes(
						['hostname', 'email', 'uri', 'number'],
						_.get(val, 'type', ''),
					)
				) {
					obj[key]['format'] = obj[key]['type'];
					obj[key]['type'] = 'string';
				}

				if (key === 'properties') {
					for (const el of _.keys(val)) {
						if (_.isObject(el)) {
							ConfigManifest.traverse(el);
						}
					}
				}
				ConfigManifest.traverse(obj[key]);
			}
		});
	}

	private readonly schema: object;

	/**
	 * ConfigManifest constructor
	 * @param {object} schema
	 */
	public constructor(schema: object) {
		this.schema = schema;
	}

	/**
	 * This is a wrapper for traverse recursive method.
	 * It will be replaced by ReConFix.
	 * @returns {any}
	 */
	JSONSchema(): any {
		const jsonSchema = _.cloneDeep(this.schema);
		ConfigManifest.traverse(jsonSchema);
		return _.get(jsonSchema, 'schema', {});
	}
}
