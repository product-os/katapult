import * as path from 'path';
import * as fs from 'mz/fs';

export const getTestDir = async (dir: string) => {
	const dirPath = path.normalize(path.join(__dirname, dir));
	if (!(await fs.exists(dirPath))) {
		throw new Error(`Unable to find dir: ${dirPath}`);
	}

	return dirPath;
};

export const getTestFile = async (file: string) => {
	const filePath = path.normalize(path.join(__dirname, file));
	if (!(await fs.exists(filePath))) {
		throw new Error(`Unable to find file: ${filePath}`);
	}

	return filePath;
};
