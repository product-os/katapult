'use strict'

const _ = require('lodash')
const forge = require('node-forge')
const Promise = require('bluebird')
const rsa = Promise.promisifyAll(forge.rsa)

/**
 *
 * @param attributes: Attribute object with the following properties:
 * 	bits: Integer. Defaults to 2048. RSA bits for generated key.
 * @returns {Promise<*string>} [PrivateKeyPEM.
 */

let generatePrivateKey = (attributes) => {
	const {
		bits = 2048
	} = attributes || {}

	return rsa.generateKeyPairAsync({ bits: bits, workers: -1 })
		.then ((keypair) => {
			return Buffer.from(forge.pki.privateKeyToPem(keypair.privateKey)).toString()
		})
}

module.exports = generatePrivateKey
