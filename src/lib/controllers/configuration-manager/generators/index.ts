import { get, keys } from 'lodash';
import * as forge from 'node-forge';

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
