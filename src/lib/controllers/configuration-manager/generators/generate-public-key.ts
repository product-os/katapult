import * as forge from 'node-forge';

/**
 * GENERATE_PUBLIC_KEY
 * @param {forge.pki.PEM} privateKeyPEM
 * @returns {Promise<string>} PublicKeyPEM
 */
export async function generatePublicKey(privateKeyPEM: forge.pki.PEM) {
	const privateKey = forge.pki.privateKeyFromPem(
		privateKeyPEM,
	) as forge.pki.rsa.PrivateKey;
	const pubKey = forge.pki.rsa.setPublicKey(privateKey.n, privateKey.e);
	return Buffer.from(forge.pki.publicKeyToPem(pubKey)).toString();
}
