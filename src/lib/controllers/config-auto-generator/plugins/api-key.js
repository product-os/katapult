'use strict'

const _ = require('lodash')

module.exports = args => {
	return _.sampleSize(
		'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
		args.length,
	).join('')
}
