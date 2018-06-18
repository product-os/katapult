import * as forge from 'node-forge';
import { convertCertAttrs } from '.';
import { generatePublicKey } from '.';
import { GenerateCACertArgs } from '.';

/**
 * GENERATE_CA_CERT
 * @param attributes: Attribute object with the following properties:
 * 	caAttrsMap: Attributes object for ca generateCertificate generation (Subject, and Issuer).
 * 	Example Object:
 * 	{
 * 		C:'GR',
 * 		L:'Athens',
 * 		O:'Balena Ltd.',
 * 		OU: 'DevOps',
 * 		CN:'global-ca.io',
 * 		ST: ''
 * 	}
 * 	validFrom: Date parsable string for CA generateCertificate validFrom field.
 * 	validTo: Date parsable string for CA generateCertificate validTo field.
 * 	caPrivateKeyPEM: Private key PEM format string.
 * @returns Promise<string> CA certificate PEM format string.
 */

export async function generateCaCert(
	attributes: GenerateCACertArgs,
): Promise<string> {
	const {
		caAttrsMap,
		validFrom,
		validTo,
		caPrivateKeyPEM: caPrivateKeyPEM,
	} = attributes;
	const attrs = await convertCertAttrs(caAttrsMap);

	const publicKey = await forge.pki.publicKeyFromPem(
		await generatePublicKey(await caPrivateKeyPEM),
	);
	const privateKey = await forge.pki.privateKeyFromPem(await caPrivateKeyPEM);
	const caCert = forge.pki.createCertificate();
	caCert.publicKey = publicKey;
	caCert.serialNumber = '01';
	caCert.validity.notBefore = new Date(validFrom);
	caCert.validity.notAfter = new Date(validTo);

	caCert.setSubject(attrs);
	caCert.setIssuer(attrs);
	caCert.setExtensions([
		{
			name: 'basicConstraints',
			cA: true,
		},
		{
			name: 'keyUsage',
			keyCertSign: true,
			digitalSignature: true,
			nonRepudiation: true,
			keyEncipherment: true,
			dataEncipherment: true,
		},
	]);
	await caCert.sign(privateKey, forge.md.sha256.create());
	return Buffer.from(forge.pki.certificateToPem(caCert)).toString();
}
