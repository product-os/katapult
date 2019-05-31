import { loadFromURI } from '../../tools';

import {
	cloneDeep,
	endsWith,
	forIn,
	get,
	includes,
	isArray,
	isObject,
	merge,
	reduce,
} from 'lodash';

export class ConfigManifest {
	static async create(productRepoURI: string): Promise<ConfigManifest> {
		// TODO: support configManifest layering
		let schema;

		schema = await loadFromURI(
			productRepoURI,
			'config-manifest.yml',
			'Unable to find config-manifest.yml. See documentation_link for more info.\n',
		);
		return new ConfigManifest({ schema });
	}

	/**
	 * This recursively transform current config-manifest schema format to JSONSchema.
	 * It will be replaced by JellySchema and ReConFix.
	 */
	private static traverse(obj: any) {
		forIn(obj, function(val, key) {
			// Convert array of properties to object
			if (isArray(val) && key === 'properties') {
				obj[key] = reduce(
					val,
					(o, v) => {
						return merge(o, v);
					},
					{},
				);
				obj['additionalProperties'] = true;
			}

			if (isObject(val)) {
				// Add required as default, unless type ends with '?'
				if (endsWith(get(val, 'type', ''), '?')) {
					obj[key]['type'] = obj[key]['type'].slice(0, -1);
				} else {
					if (!includes(['default'], key)) {
						obj[key]['required'] = true;
					}
				}
				// Handle 'hostname', 'email', 'uri' type transformations
				if (includes(['hostname', 'email', 'uri'], get(val, 'type', ''))) {
					obj[key]['format'] = obj[key]['type'];
					obj[key]['type'] = 'string';
				}
				ConfigManifest.traverse(obj[key]);
			}

			if (isArray(val)) {
				for (const el of val) {
					if (isObject(el)) {
						ConfigManifest.traverse(el);
					}
				}
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
		const jsonSchema = cloneDeep(this.schema);
		ConfigManifest.traverse(jsonSchema);
		return get(jsonSchema, 'schema', {});
	}
}
