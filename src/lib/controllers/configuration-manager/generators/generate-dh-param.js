'use strict'
const dhparam = require('dhparam')

/**
 * GENERATE_DH_PARAM
 * @param {number} bits
 * @returns {string} DH_PARAM
 */
module.exports.generateDHParam = (bits) => {
	return dhparam(bits);
}
