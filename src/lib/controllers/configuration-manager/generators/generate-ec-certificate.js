/*
Copyright 2019 Balena Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// Original: https://github.com/balena-io/ec-certificate-generator/blob/master/index.js
const { BitString, fromBER, PrintableString } = require('asn1js');
const { isNil, map } = require('lodash');
const { pem } = require('node-forge');
const {
	AlgorithmIdentifier,
	AltName,
	AttributeTypeAndValue,
	BasicConstraints,
	Certificate,
	Extension,
	GeneralName,
	PublicKeyInfo,
} = require('pkijs');
const _ = require('lodash');
const { stringToArrayBuffer } = require('pvutils');

const crypto = require('crypto');

const dnOIDMap = {
	C: '2.5.4.6',
	ST: '2.5.4.8',
	L: '2.5.4.7',
	O: '2.5.4.10',
	OU: '2.5.4.11',
	CN: '2.5.4.3',
};

/**
 * Reads PEM certificate
 * @param pemString
 */
function readPEMCertificate(pemString) {
	const cert = pem.decode(pemString)[0];

	const asn1 = fromBER(stringToArrayBuffer(cert.body));
	return new Certificate({
		schema: asn1.result,
	});
}

/**
 * Reads EC Public Key PEM
 * @param pemString
 * @returns {Promise<void>}
 */
async function readECPublicKeyPem(pemString) {
	const data = pem.decode(await pemString)[0];
	const asn1 = fromBER(stringToArrayBuffer(data.body));
	return new PublicKeyInfo({
		schema: asn1.result,
	});
}

/**
 * GENERATE_EC_CERTIFICATE: Generates EC Certificate
 * @param params
 * @returns {string}
 */
async function generateEcCertificate(params) {
	const certificate = new Certificate();
	const publicKey = await readECPublicKeyPem(params.publicKeyPEM);

	// X509 V3
	certificate.version = 2;
	const serial = crypto.randomBytes(12);
	serial[0] = 0x01;
	certificate.serialNumber.valueBlock.valueHex = serial;
	certificate.signature = new AlgorithmIdentifier({
		algorithmId: '1.2.840.10045.4.3.2',
	});
	const targetDate = new Date();
	targetDate.setDate(targetDate.getDate() + 6);

	certificate.notBefore.value = params.validFrom
		? new Date(params.validFrom)
		: new Date();
	certificate.notAfter.value = new Date(params.validTo);

	if (!isNil(params.caCertPEM)) {
		const caCertificate = readPEMCertificate(params.caCertPEM);
		certificate.issuer = caCertificate.subject;
	}

	_.forEach(params.subject, (value, key) => {
		if (value) {
			const type = dnOIDMap[key];
			if (type) {
				certificate.subject.typesAndValues.push(
					new AttributeTypeAndValue({
						type,
						value: new PrintableString({
							value,
						}),
					}),
				);
				if (isNil(params.caCertPEM)) {
					certificate.issuer.typesAndValues.push(
						new AttributeTypeAndValue({
							type,
							value: new PrintableString({
								value,
							}),
						}),
					);
				}
			}
		}
	});
	certificate.subjectPublicKeyInfo = publicKey;

	certificate.extensions = [];

	const basicConstr = new BasicConstraints({
		cA: false,
	});

	certificate.extensions.push(
		new Extension({
			extnID: '2.5.29.19',
			critical: true,
			extnValue: basicConstr.toSchema().toBER(false),
			parsedValue: basicConstr,
		}),
	);

	// Set keyUsage extension
	const bitArray = new ArrayBuffer(1);
	const bitView = new Uint8Array(bitArray);

	// tslint:disable-next-line:no-bitwise
	bitView[0] |= 0x0f;

	const keyUsage = new BitString({
		valueHex: bitArray,
	});

	certificate.extensions.push(
		new Extension({
			extnID: '2.5.29.15',
			critical: false,
			extnValue: keyUsage.toBER(false),
			parsedValue: keyUsage,
		}),
	);

	// Alternative names

	if (params.altDomains && params.altDomains.length > 0) {
		const altNames = map(params.altDomains, domain => {
			return new GeneralName({
				type: 2,
				value: domain,
			});
		});

		const altNameConstr = new AltName({
			altNames,
		});

		certificate.extensions.push(
			new Extension({
				extnID: '2.5.29.17',
				critical: false,
				extnValue: altNameConstr.toSchema().toBER(false),
				parsedValue: altNameConstr,
			}),
		);
	}

	certificate.signatureAlgorithm = new AlgorithmIdentifier({
		algorithmId: '1.2.840.10045.4.3.2',
	});

	certificate.tbs = certificate.encodeTBS();
	const bytes = certificate.tbs.toBER(false);
	const signer = crypto.createSign('SHA256');
	signer.update(Buffer.from(bytes));
	const signResult = signer.sign(await params.caPrivateKeyPEM);
	certificate.signatureValue = new BitString({
		valueHex: signResult,
	});
	const cert = Buffer.from(certificate.toSchema(true).toBER(false))
		.toString('base64')
		.replace(/(.{64})/g, '$1\n');
	return `-----BEGIN CERTIFICATE-----
${cert}
-----END CERTIFICATE-----
`;
}


module.exports.generateECCertificate = generateEcCertificate;
