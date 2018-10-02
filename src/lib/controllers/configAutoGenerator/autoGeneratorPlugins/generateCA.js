'use strict'

const _ = require('lodash')
const forge = require('node-forge')
const Promise = require('bluebird')
const rsa = Promise.promisifyAll(forge.rsa)

/**
 *
 * @param attributes: Attribute object with the following properties:
 * 	caAttrs: Attributes object for ca cert generation (Subject, and Issuer).
 * 	Example Object:
 * 	{
 * 		C:'GR',
 * 		L:'Athens',
 * 		O:'Resin Ltd.',
 * 		OU: 'NOC',
 * 		CN:'global-ca.io',
 * 		ST: ''
 * 		}
 * 	validFrom: Date parsable string for CA cert validFrom field.
 * 	validTo: Date parsable string for CA cert validTo field.
 * 	bits: Integer. Defaults to 2048. RSA bits for generated key.
 * @returns {Promise<*[String, String]>} [caCertificatePEM base64 encoded, caPrivateKeyPEM base64 encoded].
 */

let generateCA = (attributes) => {
	const {
		caAttrs,
		validFrom,
		validTo,
		bits = 2048
	} = attributes

	// reformat caAttrs to list.
	let attrs = []
	_.forEach(caAttrs, (value, key)=>{
		if(value) {
			attrs.push({
				shortName: key,
				value: value
			})
		}
	})
	return rsa.generateKeyPairAsync({ bits: bits, workers: -1 })
		.then ((keypair) => {
			let caCert = forge.pki.createCertificate()
			caCert.publicKey = keypair.publicKey
			caCert.serialNumber = '01'
			caCert.validity.notBefore = new Date(validFrom)
			caCert.validity.notAfter = new Date(validTo)

			caCert.setSubject(attrs)
			caCert.setIssuer(attrs)
			caCert.setExtensions([{
				name: 'basicConstraints',
				cA: true
			}, {
				name: 'keyUsage',
				keyCertSign: true,
				digitalSignature: true,
				nonRepudiation: true,
				keyEncipherment: true,
				dataEncipherment: true
			}])
			caCert.sign(keypair.privateKey, forge.md.sha256.create())
			return [
				Buffer.from(forge.pki.certificateToPem(caCert)).toString('base64'),
				Buffer.from(forge.pki.privateKeyToPem(keypair.privateKey)).toString('base64')
			]
		})
}

module.exports = generateCA
