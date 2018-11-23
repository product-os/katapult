'use strict'

const _ = require('lodash')

module.exports = () => {
	return _.sampleSize(
		'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
		16
	).join('')
}
