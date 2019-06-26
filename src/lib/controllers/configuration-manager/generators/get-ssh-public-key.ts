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
import { pki, ssh } from 'node-forge';

/**
 * GET_SSH_PUBLIC_KEY: Transform public key PEM to SSH format
 * @param publicKeyPEM {string}: PEM format public key string.
 * @returns {string} SSH key
 */
export function getSSHPublicKey(publicKeyPEM: string): string {
	const pubKey = pki.publicKeyFromPem(publicKeyPEM);
	return ssh.publicKeyToOpenSSH(pubKey, '');
}
