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

export declare interface DeployTargetAccess {
	kubernetes?: KubernetesDeployTargetAccess;
	compose?: DockerDeployTargetAccess;
}

export declare interface ConfigStoreAccess {
	kubernetes?: KubernetesConfigStoreAccess;
	envFile?: EnvConfigStoreAccess;
}

export declare interface DeployTargetSelections {
	name: string;
	value: string;
	short?: string;
}

export declare interface Environment {
	name: string;
	productRepo: string;
	archiveStore: string;
	deployTarget: DeployTargetAccess;
	configStore: ConfigStoreAccess;
	encryptionKeyPath: string;
}

export declare interface EnvironmentEditorArgs {
	environment: Environment;
	configurationPath: string;
	verbose?: boolean;
}
