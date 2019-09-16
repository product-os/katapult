import { Frame } from '../frame';
import { filesystemDeployAdapter } from './filesystem';
import { kubernetesDeployAdapter } from './kubernetes';

export interface FrameDeployAdapter {
	deploy: (frame: Frame) => Promise<void>;
}

export const deployAdapters = {
	filesystem: filesystemDeployAdapter,
	kubernetes: kubernetesDeployAdapter,
};
