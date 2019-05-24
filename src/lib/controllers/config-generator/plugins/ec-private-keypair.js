'use strict'
const crypto = require('crypto')
const { base64 } = require('../filter-functions')

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
	return base64(JSON.stringify({ privateKey: keypair.privateKey, publicKey: keypair.publicKey }))
}
