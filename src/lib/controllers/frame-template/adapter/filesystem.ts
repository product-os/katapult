import { FrameTemplateExportAdapter } from './index';
import { FrameTemplate } from '../';
import { promises as fs, constants } from 'fs';
import * as path from 'path';

export class InvalidOutputDirectory extends Error {
	constructor(directory: string) {
		super(`Invalid output directory '${directory}'`);
	}
}

export const filesystemExportAdapter = (
	directory: string,
): FrameTemplateExportAdapter => {
	return {
		export: async (frameTemplate: FrameTemplate) => {
			// write out each file to the filesystem...
			for (const fp of Object.keys(frameTemplate.files)) {
				const fullPath = path.join(directory, fp);
				const dir = path.dirname(fullPath);

				try {
					await fs.access(dir);
				} catch (_) {
					await fs.mkdir(dir, { recursive: true });
				}
				await fs.writeFile(fullPath, frameTemplate.files[fp]);
			}
		},
	};
};
