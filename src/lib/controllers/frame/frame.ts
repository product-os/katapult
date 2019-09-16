export interface FrameFiles {
	[path: string]: string;
}

export interface Frame {
	files: FrameFiles;
}

export function createFrame(): Frame {
	return {
		files: {},
	};
}
