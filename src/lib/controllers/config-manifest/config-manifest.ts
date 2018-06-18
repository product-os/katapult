import { loadFromURI } from '../../tools';

import * as _ from 'lodash';

export class ConfigManifest {
	static async create(
		productRepoURI: string,
		path = 'config-manifest.yml',
	): Promise<ConfigManifest> {
		// TODO: support configManifest layering
		let schema;
		schema = await loadFromURI(
			productRepoURI,
			path || 'config-manifest.yml',
			'Unable to find config-manifest.yml. See documentation_link for more info.\n',
		);
		return new ConfigManifest({ schema });
	}

	private static applyWhenCondition(obj: any, key: string): void {
		const properties = _.get(obj, key);
		const conditions: any = {};
		const anyOf: any = [];
		_.forIn(properties, function(val, key) {
			if (_.includes(_.get(val, 'when'), '==')) {
				let [dependency, value] = _.split(_.get(val, 'when'), '==');
				value = _.trim(value, '\'" ');
				dependency = _.trim(dependency);
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
			for (const v of _.values(requirements)) {
				const conditionProperties: any = {};
				for (const name of v) {
					conditionProperties[name] = properties[name];
				}
				anyOf.push({
					properties: conditionProperties,
					required: v,
				});
			}
		}

		if (anyOf.length) {
			obj['anyOf'] = anyOf;
		}
	}

	/**
	 * This method recursively transforms current config-manifest schema format to JSONSchema.
	 * It will be replaced by JellySchema and ReConFix.
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

	public constructor(schema: object) {
		this.schema = schema;
	}

	/**
	 * This is a wrapper for traverse recursive method.
	 * It will be replaced by ReConFix.
	 */
	JSONSchema() {
		const jsonSchema = _.cloneDeep(this.schema);
		ConfigManifest.traverse(jsonSchema);
		return _.get(jsonSchema, 'schema', {});
	}
}
