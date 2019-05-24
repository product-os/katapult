// Source: https://github.com/balena-io/ec-certificate-generator/blob/master/index.js
// Credits to @afitzek

const { pem } = require('node-forge')
const {
	AttributeTypeAndValue,
	AltName,
	AlgorithmIdentifier,
	BasicConstraints,
	Certificate,
	Extension,
	GeneralName,
	PublicKeyInfo
} = require('pkijs')
const { stringToArrayBuffer } = require('pvutils')
const { fromBER, PrintableString, BitString } = require('asn1js')
const _ = require('lodash')

const crypto = require('crypto')

const dnOIDMap = {
	C: '2.5.4.6', // eslint-disable-line id-length
	ST: '2.5.4.8',
	L: '2.5.4.7', // eslint-disable-line id-length
	O: '2.5.4.10', // eslint-disable-line id-length
	OU: '2.5.4.11',
	CN: '2.5.4.3'
}

const readPEMCertificate = pemString => {
	const cert = pem.decode(pemString)[0]

	const asn1 = fromBER(stringToArrayBuffer(cert.body))
	return new Certificate({
		schema: asn1.result
	})
}

const readECPublicKeyPem = pemString => {
	const data = pem.decode(pemString)[0]
	const asn1 = fromBER(stringToArrayBuffer(data.body))
	return new PublicKeyInfo({
		schema: asn1.result
	})
}

module.exports = params => {
	const certificate = new Certificate()
	const publicKey = readECPublicKeyPem(params.publicKeyPEM)

	// X509 V3
	certificate.version = 2
	const serial = crypto.randomBytes(12)
	serial[0] = 0x01
	certificate.serialNumber.valueBlock.valueHex = serial
	certificate.signature = new AlgorithmIdentifier({
		algorithmId: '1.2.840.10045.4.3.2'
	})
	let targetDate = new Date()
	targetDate.setDate(targetDate.getDate() + 6)

	certificate.notBefore.value = params.validFrom
		? new Date(params.validFrom)
		: new Date()
	certificate.notAfter.value = new Date(params.validTo)

	if (!_.isNil(params.caCertPem)) {
		const caCertificate = readPEMCertificate(params.caCertPEM)
		certificate.issuer = caCertificate.subject
	}

	_.forEach(params.subject, (value, key) => {
		if (value) {
			const type = dnOIDMap[key]
			if (type) {
				certificate.subject.typesAndValues.push(
					new AttributeTypeAndValue({
						type,
						value: new PrintableString({
							value
						})
					})
				)
				if (_.isNil(params.caCertPem)) {
					certificate.issuer.typesAndValues.push(
						new AttributeTypeAndValue({
							type,
							value: new PrintableString({
								value
							})
						})
					)
				}
			}
		}
	})
	certificate.subjectPublicKeyInfo = publicKey

	certificate.extensions = []

	const basicConstr = new BasicConstraints({
		cA: false
	})

	certificate.extensions.push(
		new Extension({
			extnID: '2.5.29.19',
			critical: true,
			extnValue: basicConstr.toSchema().toBER(false),
			parsedValue: basicConstr
		})
	)

	// Set keyUsage extension
	const bitArray = new ArrayBuffer(1)
	const bitView = new Uint8Array(bitArray)

	bitView[0] |= 0x0f // eslint-disable-line no-bitwise

	const keyUsage = new BitString({
		valueHex: bitArray
	})

	certificate.extensions.push(
		new Extension({
			extnID: '2.5.29.15',
			critical: false,
			extnValue: keyUsage.toBER(false),
			parsedValue: keyUsage
		})
	)

	// Alternative names

	if (params.altDomains && params.altDomains.length > 0) {
		const altNames = _.map(params.altDomains, domain => {
			return new GeneralName({
				type: 2,
				value: domain
			})
		})

		const altNameConstr = new AltName({
			altNames
		})

		certificate.extensions.push(
			new Extension({
				extnID: '2.5.29.17',
				critical: false,
				extnValue: altNameConstr.toSchema().toBER(false),
				parsedValue: altNameConstr
			})
		)
	}

	certificate.signatureAlgorithm = new AlgorithmIdentifier({
		algorithmId: '1.2.840.10045.4.3.2'
	})

	certificate.tbs = certificate.encodeTBS()
	const bytes = certificate.tbs.toBER(false)
	const signer = crypto.createSign('SHA256')
	signer.update(Buffer.from(bytes))
	const signResult = signer.sign(params.caPrivateKeyPEM)
	certificate.signatureValue = new BitString({
		valueHex: signResult
	})
	let cert = Buffer.from(certificate.toSchema(true).toBER(false))
		.toString('base64')
		.replace(/(.{64})/g, '$1\n')
	return `-----BEGIN CERTIFICATE-----
${cert}
-----END CERTIFICATE-----
`
}
