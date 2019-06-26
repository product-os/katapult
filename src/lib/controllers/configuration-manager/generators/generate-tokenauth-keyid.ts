/*
Copyright 2019 Balena Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import base32Encode = require('base32-encode');
import * as crypto from 'crypto';
import { base64decode } from '../filters';

/**
 * GENERATE_TOKENAUTH_KEYID: Generates Token Auth Key ID
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
