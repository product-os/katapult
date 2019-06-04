import { ECKeyPairOptions, generateKeyPairSync } from 'crypto';
import { base64 } from '../filters';

export async function generateECKeypair(): Promise<string> {
	const options = {
		namedCurve: 'prime256v1',
		publicKeyEncoding: {
			type: 'spki',
			format: 'pem',
		},
		privateKeyEncoding: {
			type: 'pkcs8',
			format: 'pem',
		},
	} as ECKeyPairOptions<'pem', 'pem'>;
	return base64(JSON.stringify(generateKeyPairSync('ec', options)));
}
