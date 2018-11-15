'use strict'

const escape = text => {
	return text
		.split('\n')
		.join('\\n')
		.split('\r')
		.join('')
		.split('\n')
		.join('\\n')
}

const base64 = value => {
	if (typeof value === 'string') {
		return Buffer.from(value).toString('base64')
	} else if (typeof value.then === 'function') {
		return value.then(val => {
			return Buffer.from(val).toString('base64')
		})
	}
}

const base64decode = value => {
	if (typeof value === 'string') {
		return Buffer.from(value, 'base64').toString()
	} else if (typeof value.then === 'function') {
		return value.then(val => {
			return Buffer.from(val, 'base64').toString()
		})
	}
}

module.exports['escape'] = escape
module.exports['base64'] = base64
module.exports['base64decode'] = base64decode
