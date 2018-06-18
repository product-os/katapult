import { sampleSize } from 'lodash';

/**
 * GENERATE_API_KEY
 * @param {number} length
 * @returns {string} API key
 * @constructor
 */
interface GenerateApiKeyArgs {
	length: number;
}

export function generateApiKey(attrs: GenerateApiKeyArgs) {
	const { length = 32 } = attrs;
	return sampleSize(
		'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
		length,
	).join('');
}
