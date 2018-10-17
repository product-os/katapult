'use strict'

module.exports = (value) => {
	if (typeof value === 'string'){
		return Buffer.from(value, 'base64').toString()
	}
	else if (typeof value.then === 'function'){
		return value.then( (val)=> {
			return Buffer.from(val, 'base64').toString()
		})
	}
}
