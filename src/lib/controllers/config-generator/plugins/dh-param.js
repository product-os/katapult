'use strict'
const dhparam = require('dhparam')

module.exports = (bits = 2048) => {
	return dhparam(bits)
}
