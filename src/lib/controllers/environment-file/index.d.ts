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
	kubernetesNamespace: string;
	kubernetesAPI: string;
}

export declare interface DockerDeployTarget extends BastionTarget {
	dockerSocket: string;
}

export declare interface KubernetesConfigStore extends BastionTarget {
	kubernetesNamespace: string;
	kubernetesAPI: string;
}

export declare interface EnvConfigStore extends BastionTarget {
	path: string;
}

export type DeployTarget = KubernetesDeployTarget | DockerDeployTarget;
export type ConfigStore = KubernetesConfigStore | EnvConfigStore;

export declare interface DeployTargetSelections {
	name: string;
	value: string;
	short?: string;
}

export declare interface Environment {
	name: string;
	templates: string;
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
