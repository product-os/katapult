'use strict'

const forge = require('node-forge')

/**
 *
 * @param privateKeyPEM: PEM format private key string.
 * @returns PublicKeyPEM.
 */

const generatePublicKey = privateKeyPEM => {
	let privateKey = forge.pki.privateKeyFromPem(privateKeyPEM)
	let pubKey = forge.pki.rsa.setPublicKey(privateKey.n, privateKey.e)
	return Buffer.from(forge.pki.publicKeyToPem(pubKey)).toString()
}

module.exports = generatePublicKey
