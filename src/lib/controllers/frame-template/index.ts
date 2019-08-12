import * as fs from 'mz/fs';
import * as path from 'path';

export interface FrameTemplateFiles {
	[path: string]: any;
}

export interface FrameTemplate {
	files: FrameTemplateFiles;
}

export const fromDirectory = async (
	directory: string,
): Promise<FrameTemplate> => {
	const files: FrameTemplateFiles = {};

	for (const fp of await fs.readdir(directory)) {
		const filePath = path.join(directory, fp);
		const stats = await fs.stat(filePath);

		if (stats.isFile()) {
			files[fp] = await fs.readFile(filePath, 'utf8');
		} else if (stats.isDirectory()) {
			const { files: directoryFiles } = await fromDirectory(filePath);

			for (const innerFp of Object.keys(directoryFiles)) {
				files[`${fp}/${innerFp}`] = directoryFiles[innerFp];
			}
		}
	}

	return {
		files,
	};
};
