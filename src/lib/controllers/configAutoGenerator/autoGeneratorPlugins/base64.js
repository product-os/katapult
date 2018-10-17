'use strict'

module.exports = (value) => {
	if (typeof value === 'string'){
		return Buffer.from(value).toString('base64')
	}
	else if (typeof value.then === 'function'){
		return value.then( (val)=> {
			return Buffer.from(val).toString('base64')
		})
	}
}
