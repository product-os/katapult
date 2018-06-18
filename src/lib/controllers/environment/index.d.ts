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
