'use strict';
import * as Bluebird from 'bluebird';
import { stat, statSync } from 'fs';
const statAsync = Bluebird.promisify(stat);

export async function validateDirectoryPath(
	path: string,
	raise = true,
): Promise<boolean> {
	try {
		const stat = await statAsync(path);
		if (!stat.isDirectory()) {
			if (raise) {
				throw new Error('Error: ' + path + ' is not a directory');
			}
			return false;
		}
		return true;
	} catch (error) {
		if (raise) {
			throw error;
		}
		return false;
	}
}

export function validateDirectoryPathSync(path: string, raise = true): boolean {
	try {
		const st = statSync(path);
		if (!st.isDirectory()) {
			if (raise) {
				throw new Error('Error: ' + path + ' is not a directory');
			}
			return false;
		}
		return true;
	} catch (error) {
		if (raise) {
			throw error;
		}
		return false;
	}
}

export async function validateFilePath(
	path: string,
	raise = true,
): Promise<boolean> {
	try {
		const stat = await statAsync(path);
		if (!stat.isFile()) {
			if (raise) {
				throw new Error('Error: ' + path + ' is not a file');
			}
			return false;
		}
		return true;
	} catch (error) {
		if (raise) {
			throw error;
		}
		return false;
	}
}

export function validateFilePathSync(path: string, raise = true): boolean {
	try {
		const stat = statSync(path);
		if (!stat.isFile()) {
			if (raise) {
				throw new Error('Error: ' + path + ' is not a file');
			}
			return false;
		}
		return true;
	} catch (error) {
		if (raise) {
			throw error;
		}
		return false;
	}
}

export function validateFQDN(value: any, raise = true): boolean {
	const rex = /^[\w\.]+$/;

	if (value.match(rex)) {
		return true;
	}
	if (raise) {
		throw new Error('Please enter a valid FQDN');
	}
	return false;
}

export function validatePort(value: any, raise = true): boolean {
	const rex = /^\d+$/;

	if (value.match(rex) && Number(value) > 0 && Number(value) < 65536) {
		return true;
	}
	if (raise) {
		throw new Error('Please enter a valid port number in the range: 1-65535');
	}
	return false;
}

export function validateString(value: any, raise = true) {
	if (value.match(/^[\w-]+$/)) {
		return true;
	}

	if (raise) {
		throw new Error('Please enter a valid value');
	}

	return false;
}

export function inquirerValidatePath(value: any): boolean {
	return validateFilePathSync(value, true);
}

export function inquirerValidateDirectory(value: any): boolean {
	return validateDirectoryPathSync(value, true);
}

export function inquirerValidateFQDN(value: any): boolean {
	return validateFQDN(value, true);
}

export function inquirerValidatePort(value: any): boolean {
	return validatePort(value, true);
}

export function inquirerValidateString(value: any): boolean {
	return validateString(value, true);
}
