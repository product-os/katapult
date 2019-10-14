import * as fs from 'mz/fs';
import * as path from 'path';

export interface TemplateGeneratorFiles {
	[path: string]: string;
}

export interface TemplateGenerator {
	files: TemplateGeneratorFiles;
}

export const fromDirectory = async (
	directory: string,
): Promise<TemplateGenerator> => {
	const files: TemplateGeneratorFiles = {};

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
