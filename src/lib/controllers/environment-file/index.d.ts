export declare interface Bastion {
	bastionHost: string;
	bastionPort?: string;
	bastionUsername: string;
	bastionKey: string;
	bastionKeyPassword?: string;
}

export declare interface BastionTarget {
	bastion?: Bastion;
}

export declare interface KubernetesDeployTarget extends BastionTarget {
	namespace: string;
	endpoint: string;
}

export declare interface DockerDeployTarget extends BastionTarget {
	socket: string;
}

export declare interface KubernetesConfigStore extends BastionTarget {
	namespace: string;
	endpoint: string;
}

export declare interface EnvConfigStore extends BastionTarget {
	path: string;
}

export declare interface DeployTarget {
	kubernetes?: KubernetesDeployTarget;
	compose?: DockerDeployTarget;
}

export declare interface ConfigStore {
	kubernetes?: KubernetesConfigStore;
	envFile?: EnvConfigStore;
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
	deployTarget: DeployTarget;
	configStore: ConfigStore;
	encryptionKeyPath: string;
}

export declare interface EnvironmentEditorArgs {
	environment: Environment;
	configurationPath: string;
	verbose?: boolean;
}
