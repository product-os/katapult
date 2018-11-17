'use strict'

const _ = require('lodash')
const forge = require('node-forge')
const generatePublicKey = require('./public-key')

/**
 *
 * @param attributes: Attribute object with the following properties:
 * 	caAttrs: Attributes object for ca cert generation (Subject, and Issuer).
 * 	Example Object:
 * 	{
 * 		C:'GR',
 * 		L:'Athens',
 * 		O:'Balena Ltd.',
 * 		OU: 'DevOps',
 * 		CN:'global-ca.io',
 * 		ST: ''
 * 	}
 * 	validFrom: Date parsable string for CA cert validFrom field.
 * 	validTo: Date parsable string for CA cert validTo field.
 * 	caPrivateKeyPEM: Private key PEM format string.
 * @returns {string} CA certificate PEM format string.
 */

const generateCACert = attributes => {
	const {
		caAttrs,
		validFrom,
		validTo,
		caPrivateKeyPEM: caPrivateKeyPEM
	} = attributes

	// reformat caAttrs to list.
	let attrs = []
	_.forEach(caAttrs, (value, key) => {
		if (value) {
			attrs.push({
				shortName: key,
				value: value
			})
		}
	})

	let publicKey = forge.pki.publicKeyFromPem(generatePublicKey(caPrivateKeyPEM))
	let privateKey = forge.pki.privateKeyFromPem(caPrivateKeyPEM)
	let caCert = forge.pki.createCertificate()
	caCert.publicKey = publicKey
	caCert.serialNumber = '01'
	caCert.validity.notBefore = new Date(validFrom)
	caCert.validity.notAfter = new Date(validTo)

	caCert.setSubject(attrs)
	caCert.setIssuer(attrs)
	caCert.setExtensions([
		{
			name: 'basicConstraints',
			cA: true
		},
		{
			name: 'keyUsage',
			keyCertSign: true,
			digitalSignature: true,
			nonRepudiation: true,
			keyEncipherment: true,
			dataEncipherment: true
		}
	])
	caCert.sign(privateKey, forge.md.sha256.create())
	return Buffer.from(forge.pki.certificateToPem(caCert)).toString()
}

module.exports = generateCACert
