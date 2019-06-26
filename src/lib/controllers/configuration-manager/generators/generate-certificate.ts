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
import { includes } from 'lodash';
import * as forge from 'node-forge';
import { convertAltNames, convertCertAttrs, GenerateCertArgs } from '.';
import { generatePublicKey } from '.';

/**
 * GENERATE_CERTIFICATE
 * @param attributes: Attribute object with the following properties:
 * 	certAttrsMap: Attributes object for generateCertificate generation (Subject).
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
 * 	validFrom: Date parsable string for generateCertificate validFrom field.
 * 	validTo: Date parsable string for generateCertificate validTo field.
 * 	extKeyUsage: List of extended usages.
 * 		Example: ['serverAuth', 'clientAuth']
 *
 * 	@returns {Promise<string>} Certificate PEM format string.
 */
export async function generateCertificate(
	attributes: GenerateCertArgs,
): Promise<string> {
	const {
		certAttrsMap,
		caCertPEM,
		caPrivateKeyPEM,
		altDomains = [],
		validFrom,
		validTo,
		privateKeyPEM,
		extKeyUsage,
	} = attributes;

	const attrs = convertCertAttrs(certAttrsMap);

	const altNames = convertAltNames(altDomains);
	const caCert = forge.pki.certificateFromPem(await caCertPEM);
	const caPK = forge.pki.privateKeyFromPem(await caPrivateKeyPEM);
	const publicKey = forge.pki.publicKeyFromPem(
		await generatePublicKey(await privateKeyPEM),
	);
	const cert = forge.pki.createCertificate();

	cert.publicKey = publicKey;
	cert.serialNumber = '05';
	cert.validity.notBefore = new Date(validFrom);
	cert.validity.notAfter = new Date(validTo);
	cert.setSubject(attrs);
	cert.setIssuer(caCert.subject.attributes);
	const extensions = [
		{
			name: 'basicConstraints',
			cA: false,
		},
		{
			name: 'keyUsage',
			digitalSignature: true,
			nonRepudiation: true,
			keyEncipherment: true,
			dataEncipherment: true,
		},
		{
			name: 'extKeyUsage',
			serverAuth: includes(extKeyUsage, 'serverAuth'),
			clientAuth: includes(extKeyUsage, 'clientAuth'),
			codeSigning: includes(extKeyUsage, 'codeSigning'),
			emailProtection: includes(extKeyUsage, 'emailProtection'),
			timeStamping: includes(extKeyUsage, 'timeStamping'),
		},
		{
			name: 'subjectAltName',
			altNames,
		},
	];

	cert.setExtensions(extensions);
	cert.sign(caPK, forge.md.sha256.create());
	return Buffer.from(forge.pki.certificateToPem(cert)).toString();
}
