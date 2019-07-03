import { FrameExportAdapter } from './index';
import { Frame } from '../frame';
import * as fs from 'mz/fs';
import * as path from 'path';

export const filesystemExportAdapter = (
	directory: string,
): FrameExportAdapter => {
	return {
		export: async (frame: Frame) => {
			// make sure the the directory we want to export to exists...
			const canExport = await fs.exists(directory);
			if (!canExport) {
				throw new Error('The directory to export to does not exist');
			}

			// write out each file to the filesystem...
			for (const fp of Object.keys(frame.files)) {
				const fullPath = path.join(directory, fp);
				const dir = path.dirname(fullPath);

				fs.mkdirSync(dir, { recursive: true });
				await fs.writeFile(fullPath, frame.files[fp]);
			}
		},
	};
};
