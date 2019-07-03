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
import * as forge from 'node-forge';

/**
 * GENERATE_PUBLIC_KEY: Gets public key from a private key
 * @param {forge.pki.PEM} privateKeyPEM
 * @returns {Promise<string>} PublicKeyPEM
 */
export async function generatePublicKey(
	privateKeyPEM: forge.pki.PEM,
): Promise<string> {
	const privateKey: forge.pki.rsa.PrivateKey = forge.pki.privateKeyFromPem(
		privateKeyPEM,
	);
	const pubKey = forge.pki.rsa.setPublicKey(privateKey.n, privateKey.e);
	return Buffer.from(forge.pki.publicKeyToPem(pubKey)).toString();
}
