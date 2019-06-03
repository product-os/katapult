import { ValidationError } from 'jsonschema';
import { ConfigManifest } from '../config-manifest/config-manifest';
import { ConfigMap } from '../config-store';
import { ConfigStore } from '../config-store/config-store';

export declare interface ConfigurationManagerArgs {
	configManifest: ConfigManifest;
	configStore: ConfigStore;
	configMap: ConfigMap;
	mode?: string;
}

export interface ConfigurationManagerCreateArgs {
	configurationPath: string;
	mode?: string;
}

export interface ErrorMap {
	[key: string]: ValidationError;
}
