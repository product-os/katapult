'use strict'

const _ = require('lodash')
const forge = require('node-forge')
const Promise = require('bluebird')
const pki = Promise.promisifyAll(forge.pki)
const generatePublicKey = require('./public-key')

/**
 * @param attributes: Attribute object with the following properties:
 * 	certAttrs: Attributes object for cert generation (Subject).
 * 	Example Object:
 * 	{
 * 		C:'GR',
 * 		ST: 'Attiki',
 * 		L:'Athens',
 * 		O:'Balena Ltd.',
 * 		OU: 'DevOps',
 * 		CN:'custom-domain.io'
 * 	}
 * 	caCertPEM: PEM string of CA certificate
 * 	caPrivateKeyPEM: PEM string of CA private key
 * 	privateKeyPEM: PEM string of certificate private key
 * 	altDomains: List of alt domains.
 * 		Example: ['*.custom-domain.io', '*.devices.custom-domain.io']
 * 	validFrom: Date parsable string for cert validFrom field.
 * 	validTo: Date parsable string for cert validTo field.
 *
 * 	@returns {string} Certificate PEM format string.
 */
let generateCert = (attributes) => {

	const {
		certAttrs,
		caCertPEM,
		caPrivateKeyPEM,
		altDomains,
		validFrom,
		validTo,
		privateKeyPEM
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
	let publicKey = forge.pki.publicKeyFromPem(generatePublicKey(privateKeyPEM))
	let cert = forge.pki.createCertificate()
	cert.publicKey = publicKey
	cert.serialNumber = '05'
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
	return Buffer.from(forge.pki.certificateToPem(cert)).toString()
}

module.exports = generateCert
