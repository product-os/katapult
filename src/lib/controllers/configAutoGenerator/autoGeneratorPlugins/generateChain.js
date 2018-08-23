'use strict'

const generateCA = require('./generateCA')
const generateCert = require('./generateCert')

/**
 * @param attributes: Attribute object with the following properties:
 * 	caAttrs: Attributes object for ca cert generation (Subject, and Issuer).
 *    Example Object:
 *    {
 *    	C:'GR',
 *    	L:'Athens',
 *    	O:'Resin Ltd.',
 *    	OU: 'NOC',
 *    	CN:'global-ca.io',
 *    	ST: ''
 *    	}
 * 	caValidFrom: Date parsable string for CA cert validFrom field.
 * 	caValidTo: Date parsable string for CA cert validTo field.
 * 	certAttrs: Attributes object for cert generation (Subject).
 *    Example Object:
 *    {
 *    	C:'GR',
 *    	ST: 'Attiki',
 *    	L:'Athens',
 *    	O:'Resin Ltd.',
 *    	OU: 'NOC',
 *    	CN:'custom-domain.io'
 *    	}
 * 	altDomains: List of alt domains.
 *    Example: ['*.custom-domain.io', '*.devices.custom-domain.io']
 * 	validFrom: Date parsable string for cert validFrom field.
 * 	validTo: Date parsable string for cert validTo field.
 * 	bits: Integer. Defaults to 2048. RSA bits for generated key.
 * @returns {Promise <*[String, String, String]>}  [ChainPem, caPemCert, caPKPem]
 * 	ChainPem: The CA, cert, and CHAIN.
 * 	caPemCert: The PEM CA certificate. In case its needed for more certs.
 * 	caPKPem: The PEM CA private key. In case its needed for more certs signing.
 */

// caAttrs, caValidFrom, caValidTo, certAttrs, altDomains, validFrom, validTo, bits=2048
let generateChain = (attributes) => {
	const {
		caAttrs,
		caValidFrom,
		caValidTo,
		certAttrs,
		altDomains,
		validFrom,
		validTo,
		bits=2048
	} = attributes

	return generateCA({
		caAttrs: caAttrs,
		caValidFrom: caValidFrom,
		caValidTo: caValidTo,
		bits: bits
	})
		.then(([caCertPEM, caPrivateKeyPEM])=>{
			return generateCert({
				certAttrs: certAttrs,
				caCertPEM: caCertPEM,
				caPrivateKeyPEM: caPrivateKeyPEM,
				altDomains: altDomains,
				validFrom: validFrom,
				validTo: validTo,
				bits: bits
			})
				.then(([PemCert, PemPK]) => {
					return [PemCert+caCertPEM+PemPK, caCertPEM, caPrivateKeyPEM]
				})
		})
}

module.exports = generateChain
