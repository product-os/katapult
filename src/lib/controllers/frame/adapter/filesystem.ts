import { FrameDeployAdapter } from './index';
import { Frame } from '../frame';
import { promises as fs } from 'fs';
import * as path from 'path';

export class InvalidOutputDirectory extends Error {
	constructor(directory: string) {
		super(`Invalid output directory '${directory}'`);
	}
}

export const filesystemDeployAdapter = (
	directory: string,
): FrameDeployAdapter => {
	return {
		deploy: async (frame: Frame) => {
			// write out each file to the filesystem...
			for (const fp of Object.keys(frame.files)) {
				const fullPath = path.join(directory, fp);
				const dir = path.dirname(fullPath);

				try {
					await fs.access(dir);
				} catch (_) {
					await fs.mkdir(dir, { recursive: true });
				}
				await fs.writeFile(fullPath, frame.files[fp]);
			}
		},
	};
};
