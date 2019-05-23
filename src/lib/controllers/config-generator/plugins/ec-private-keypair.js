'use strict'
const crypto = require('crypto')

module.exports = () => {
	const keypair = crypto.generateKeyPairSync('ec', {
		namedCurve: 'prime256v1',
		publicKeyEncoding: {
			type: 'spki',
			format: 'pem'
		},
		privateKeyEncoding: {
			type: 'pkcs8',
			format: 'pem'
		}
	})
	return { privateKey: keypair.privateKey, publicKey: keypair.publicKey }
}
