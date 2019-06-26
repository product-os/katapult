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
import { pki } from 'node-forge';

/**
 * GENERATE_PRIVATE_KEY: Generates private key. bits default to 4096
 * @param {number} bits: Defaults to 4096. RSA bits for generated key.
 * @returns {string} PrivateKeyPEM
 */
export function generatePrivateKey(bits = 4096): string {
	return Buffer.from(
		pki.privateKeyToPem(
			pki.rsa.generateKeyPair({ bits, workers: 1 }).privateKey,
		),
	).toString();
}
