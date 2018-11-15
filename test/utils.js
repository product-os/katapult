'use strict'
const { loadFromFile } = require('../src/lib/utils')
const { assert } = require('chai')

const assertFilesEqual = (path1, path2) => {
	return loadFromFile(path1).then(obj1 => {
		return loadFromFile(path2).then(obj2 => {
			return assert.deepEqual(obj1, obj2)
		})
	})
}

module.exports.assertFilesEqual = assertFilesEqual
