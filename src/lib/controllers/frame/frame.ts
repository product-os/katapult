import { ConfigMap } from '../config-store/config-store';

export interface FrameFiles {
	[path: string]: string;
}

export interface Frame {
	files: FrameFiles;
	configMap: ConfigMap;
}

export function createFrame(): Frame {
	return {
		files: {},
		configMap: {},
	};
}
