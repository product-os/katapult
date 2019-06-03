'use strict'

const crypto = require('crypto')
const base32 = require('base32-encode')
const { base64decode } = require('../filter-functions')

/**
 *
 * @param privateKeyPEM {string}: PEM format private key string.
 * @returns {string} RSA KeyID
 */
module.exports = keypairJSON => {
	const keypair = JSON.parse(base64decode(keypairJSON));
	const derBuffer = Buffer.from(
		keypair.publicKey.replace(/(---.*---\n)|(\n)/g, ''),
		'base64'
	)
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
