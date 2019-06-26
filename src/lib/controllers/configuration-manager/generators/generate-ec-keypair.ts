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
import { ECKeyPairOptions, generateKeyPairSync } from 'crypto';
import { base64 } from '../filters';

/**
 * GENERATE_EC_KEYPAIR: Generates EC key pair
 * @returns {Promise<string>}
 */
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
