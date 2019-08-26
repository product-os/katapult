import { FrameExportAdapter } from './index';
import { Frame } from '../frame';
// import * as fs from 'mz/fs';
import { promises as fs } from 'fs';
import * as path from 'path';

export class InvalidOutputDirectory extends Error {
	constructor(directory: string) {
		super(`Invalid output directory '${directory}'`);
	}
}

export const filesystemExportAdapter = (
	directory: string,
): FrameExportAdapter => {
	return {
		export: async (frame: Frame) => {
			// write out each file to the filesystem...
			for (const fp of Object.keys(frame.files)) {
				const fullPath = path.join(directory, fp);
				const dir = path.dirname(fullPath);

				await fs.mkdir(dir, { recursive: true });
				await fs.writeFile(fullPath, frame.files[fp]);
			}
		},
	};
};
