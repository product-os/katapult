'use strict'

const forge = require('node-forge');

/**
 *
 * @param privateKeyPEM {string}: PEM format private key string.
 * @returns {string} SSH key
 */
module.exports = publicKeyPEM => {
	const pubKey = forge.pki.publicKeyFromPem(publicKeyPEM);
	return forge.ssh.publicKeyToOpenSSH(pubKey, '');
}
