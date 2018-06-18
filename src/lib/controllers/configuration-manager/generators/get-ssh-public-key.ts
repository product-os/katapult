import { pki, ssh } from 'node-forge';

/**
 *
 * @param publicKeyPEM {string}: PEM format public key string.
 * @returns {string} SSH key
 */
export function getSSHPublicKey(publicKeyPEM: string): string {
	const pubKey = pki.publicKeyFromPem(publicKeyPEM);
	return ssh.publicKeyToOpenSSH(pubKey, '');
}
