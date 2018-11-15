'use strict'
const crypto = require('crypto')

module.exports = () => {
	let ec = crypto.createECDH('prime256v1')
	ec.generateKeys()
	return `-----BEGIN EC PRIVATE KEY-----
${Buffer.from(
		`30770201010420${ec.getPrivateKey(
			'hex',
		)}A00A06082A8648CE3D030107A14403420004${ec.getPublicKey('hex')}`,
		'hex',
	).toString('base64')}
-----END EC PRIVATE KEY-----`
}
