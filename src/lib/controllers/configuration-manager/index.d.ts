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
	configManifest: ConfigManifest;
	configStore: ConfigStore;
	configMap?: ConfigMap;
	mode?: string;
}

export interface ErrorMap {
	[key: string]: ValidationError;
}
