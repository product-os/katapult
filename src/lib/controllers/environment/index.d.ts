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

export declare interface Bastion {
	host: string;
	port?: string;
	localPort?: string;
	username: string;
	key: string;
	keyPassword?: string;
}

export declare interface BastionTarget {
	bastion?: Bastion;
}

export declare interface KubernetesDeployTargetAccess extends BastionTarget {
	namespace: string;
	endpoint: string;
	kubeConfigPath: string;
}

export declare interface DockerDeployTargetAccess extends BastionTarget {
	socket: string;
}

export declare interface KubernetesConfigStoreAccess extends BastionTarget {
	namespace: string;
	endpoint: string;
	kubeConfigPath: string;
}

export declare interface EnvConfigStoreAccess extends BastionTarget {
	path: string;
}

export declare interface YamlConfigStoreAccess extends BastionTarget {
	path: string;
}

export declare interface DeployTargetAccess {
	kubernetes?: KubernetesDeployTargetAccess;
	compose?: DockerDeployTargetAccess;
}

export declare interface ConfigStoreAccess {
	kubernetes?: KubernetesConfigStoreAccess;
	envFile?: EnvConfigStoreAccess;
	yamlFile?: YamlConfigStoreAccess;
}

export declare interface Environment {
	productRepo: string;
	archiveStore: string;
	deployTarget: DeployTargetAccess;
	configStore: ConfigStoreAccess;
	encryptionKeyPath: string;
}

export declare interface BastionConfiguration {
	host: string;
	port?: string;
	localPort?: string;
	username: string;
}

export declare interface ConfigStoreAccessConfiguration {
	type: string;
	endpoint?: string;
	namespace?: string;
	envFile?: string;
	bastion?: BastionConfiguration;
}

export declare interface KatapultFile {
	version: string;
	'config-store': ConfigStoreAccessConfiguration;
}
