'use strict'

const escape = (text) => {
	return text.split('\n').join('\\n').split('\r').join('').split('\n').join('\\n')
}

module.exports['escape'] = escape
