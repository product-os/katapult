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
import { GenerateCertArgs, generateCertificate } from '.';

/**
 * GENERATE_CERT_CHAIN
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
 * 		}
 * 	caCertPEM: Pem string of CA certificate, base64 encoded
 * 	caPrivateKeyPEM: Pem private key string of CA, base64 encoded
 * 	privateKeyPEM: Pem private key string for certificate
 * 	altDomains: List of alt domains.
 * 		Example: ['*.custom-domain.io', '*.devices.custom-domain.io']
 * 	validFrom: Date parsable string for generateCertificate validFrom field.
 * 	validTo: Date parsable string for generateCertificate validTo field.
 * 	bits: Integer. Defaults to 2048. RSA bits for generated key.
 * 	@returns {Promise<string>} CertificateChainPEM, base64 encoded
 */
export async function generateCertChain(
	attributes: GenerateCertArgs,
): Promise<string> {
	const { caCertPEM, privateKeyPEM } = attributes;
	const certPEM = await generateCertificate(attributes);
	return certPEM + caCertPEM + privateKeyPEM;
}
