'use strict'

const _ = require('lodash')
const forge = require('node-forge')
const Promise = require('bluebird')
const rsa = Promise.promisifyAll(forge.rsa)
const pki = Promise.promisifyAll(forge.pki)

/**
 * @param attributes: Attribute object with the following properties:
 * 	certAttrs: Attributes object for cert generation (Subject).
 * 	Example Object:
 * 	{
 * 		C:'GR',
 * 		ST: 'Attiki',
 * 		L:'Athens',
 * 		O:'Resin Ltd.',
 * 		OU: 'NOC',
 * 		CN:'custom-domain.io'
 * 		}
 * 	caCertPEM: Pem string of CA certificate
 * 	caPrivateKeyPEM: Pem private key string of CA
 * 	altDomains: List of alt domains.
 * 		Example: ['*.custom-domain.io', '*.devices.custom-domain.io']
 * 	validFrom: Date parsable string for cert validFrom field.
 * 	validTo: Date parsable string for cert validTo field.
 * 	bits: Integer. Defaults to 2048. RSA bits for generated key.
 * 	@returns {Promise<*[String, String]>} [CertificatePEM, PrivateKeyPEM].
 */
let generateCert = (attributes) => {

	const {
		certAttrs,
		caCertPEM,
		caPrivateKeyPEM,
		altDomains,
		validFrom,
		validTo,
		bits=2048
	} = attributes

	// reformat caAttrs to list.
	let subjectAttrs = []
	_.forEach(certAttrs, (value, key) => {
		if (value) {
			subjectAttrs.push({
				shortName: key,
				value: value
			})
		}
	})
	// reformat altDomains to altNames list.
	let altNames = []
	_.forEach(altDomains, (domain) => {
		altNames.push({
			type: 2, // DNS
			value: domain
		})
	})
	let caCert = pki.certificateFromPem(caCertPEM)
	let caPK = forge.pki.privateKeyFromPem(caPrivateKeyPEM)

	return rsa.generateKeyPairAsync({bits: bits, workers: -1}).then((key) => {
		let cert = forge.pki.createCertificate()
		cert.publicKey = key.publicKey
		cert.serialNumber = '01'
		cert.validity.notBefore = new Date(validFrom)
		cert.validity.notAfter = new Date(validTo)
		cert.setSubject(subjectAttrs)
		cert.setIssuer(caCert.subject.attributes)
		cert.setExtensions([{
			name: 'basicConstraints',
			cA: false
		}, {
			name: 'keyUsage',
			digitalSignature: true,
			nonRepudiation: true,
			keyEncipherment: true,
			dataEncipherment: true
		}, {
			name: 'subjectAltName',
			altNames: altNames
		}])
		cert.sign(caPK, forge.md.sha256.create())
		return [forge.pki.certificateToPem(cert), forge.pki.privateKeyToPem(key.privateKey)]
	})
}

module.exports = generateCert
