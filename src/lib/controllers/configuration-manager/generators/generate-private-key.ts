import { pki } from 'node-forge';

/**
 * GENERATE_PRIVATE_KEY
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
