'use strict'

const crypto = require('crypto')
const forge = require('node-forge')
const base32 = require('base32-encode')

/**
 *
 * @param privateKeyPEM {string}: PEM format private key string.
 * @returns {string} RSA KeyID
 */
module.exports = privateKeyPEM => {
	const privateKey = forge.pki.privateKeyFromPem(privateKeyPEM)
	const pubKey = forge.pki.rsa.setPublicKey(privateKey.n, privateKey.e)
	const der = forge.asn1.toDer(forge.pki.publicKeyToAsn1(pubKey))
	const derBuffer = Buffer.from(der.data, 'binary')
	const hasher = crypto.createHash('sha256').update(derBuffer)
	const b32 = base32(hasher.digest().slice(0, 30), 'RFC4648', {
		padding: false
	}).toString()
	let chunks = []
	for (let i = 0; i < b32.length; i += 4) {
		chunks.push(b32.substr(i, 4))
	}
	return chunks.join(':')
}
