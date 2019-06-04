import { pki } from 'node-forge';

/**
 * GENERATE_PRIVATE_KEY
 * @param {number} bits: Defaults to 4096. RSA bits for generated key.
 * @returns {Promise<string>} PrivateKeyPEM
 */
export function generatePrivateKey(bits = 4096) {
	const keypair = pki.rsa.generateKeyPair({ bits, workers: 1 });
	return Buffer.from(pki.privateKeyToPem(keypair.privateKey)).toString();
}
