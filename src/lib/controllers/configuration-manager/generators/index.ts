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
import { get, keys } from 'lodash';
import * as forge from 'node-forge';

export * from './generate-api-key';
export * from './generate-ca-cert';
export * from './generate-certificate';
export * from './generate-cert-chain';
export * from './generate-dh-param';
export * from './generate-ec-certificate';
export * from './generate-ec-keypair';
export * from './generate-private-key';
export * from './generate-public-key';
export * from './generate-tokenauth-keyid';
export * from './get-ec-private-key';
export * from './get-ec-public-key';
export * from './get-ssh-public-key';

export interface CertAttrs {
	[key: string]: string;
}

export interface CertAttrsMap {
	C: string;
	L: string;
	O: string;
	OU?: string;
	CN?: string;
	ST?: string;
}

export interface GenerateCACertArgs {
	caAttrsMap: CertAttrsMap;
	validFrom: string;
	validTo: string;
	caPrivateKeyPEM: string;
}

export interface GenerateCertArgs {
	certAttrsMap: CertAttrsMap;
	caCertPEM: forge.pki.PEM;
	validFrom: string;
	validTo: string;
	caPrivateKeyPEM: forge.pki.PEM;
	privateKeyPEM: forge.pki.PEM;
	extKeyUsage: string[];
	altDomains: string[];
}

export interface AltName {
	type: number;
	value: string;
}

/**
 * Convert certAttrsMap to certAttrs
 * @param {CertAttrsMap} certAttrsMap
 * @returns {CertAttrs[]}
 */
export function convertCertAttrs(certAttrsMap: CertAttrsMap): CertAttrs[] {
	const attrs: CertAttrs[] = [];
	for (const key of keys(certAttrsMap)) {
		if (get(certAttrsMap, key)) {
			attrs.push({
				shortName: key,
				value: get(certAttrsMap, key),
			});
		}
	}
	return attrs;
}

/**
 * Convert altDomains to altNames list.
 * @param {string[]} altDomains
 * @returns {AltName[]}
 */
export function convertAltNames(altDomains: string[]): AltName[] {
	const altNames = [];
	for (const domain of altDomains) {
		altNames.push({
			type: 2, // DNS
			value: domain,
		});
	}
	return altNames;
}
