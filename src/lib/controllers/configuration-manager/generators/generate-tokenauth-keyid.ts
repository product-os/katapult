import base32Encode = require('base32-encode');
import * as crypto from 'crypto';
import { base64decode } from '../filters';

/**
 * GENERATE_TOKENAUTH_KEYID
 * @param {string} keypairJSON: base64 JSON key pair.
 * @returns {Promise<string>}
 */
export async function generateTokenauthKeyid(
	keypairJSON: string,
): Promise<string> {
	const keypair = JSON.parse(await base64decode(keypairJSON));
	const derBuffer = Buffer.from(
		keypair.publicKey.replace(/(---.*---\n)|(\n)/g, ''),
		'base64',
	);
	const hasher = crypto.createHash('sha256').update(derBuffer);
	const b32 = base32Encode(hasher.digest().slice(0, 30), 'RFC4648', {
		padding: false,
	}).toString();
	const chunks = [];
	for (let i = 0; i < b32.length; i += 4) {
		chunks.push(b32.substr(i, 4));
	}
	return chunks.join(':');
}
