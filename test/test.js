'use strict'
const { validateFilePath, validateDirectoryPath } = require('../src/lib/utils')
const deploySpec = require('../src/lib/controllers/deploy-spec')
const { assertFilesEqual } = require('./utils')
const Promise = require('bluebird')
const { assert } = require('chai')
const mkdirAsync = Promise.promisify(require('fs').mkdir)
const execAsync = Promise.promisify(require('child_process').exec)
