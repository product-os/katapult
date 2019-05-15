import {
	DockerDeployTarget,
	EnvConfigStore,
	EnvironmentObject,
	KubernetesConfigStore,
	KubernetesDeployTarget,
} from '.';

export class Environment implements EnvironmentObject {
	name: string;
	templates: string;
	archiveStore: string;
	deployTarget: KubernetesDeployTarget | DockerDeployTarget;
	configStore: KubernetesConfigStore | EnvConfigStore;

	constructor(env: {
		templates: string;
		name: string;
		archiveStore: string;
		deployTarget: KubernetesDeployTarget | DockerDeployTarget;
		configStore: KubernetesConfigStore | EnvConfigStore;
	}) {
		const { name, templates, archiveStore, deployTarget, configStore } = env;
		this.name = name;
		this.templates = templates;
		this.archiveStore = archiveStore;
		this.deployTarget = deployTarget;
		this.configStore = configStore;
	}
}
