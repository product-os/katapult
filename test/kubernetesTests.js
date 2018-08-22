'use strict'
const templateGenerator = require('../src/lib/controllers/deploySpec')
const path = require('path')
const Promise = require('bluebird')
const { assert } = require('chai')
const assertFilesEqual = require('./testUtils').assertFilesEqual
const mkdirAsync = Promise.promisify(require('fs').mkdir)
const readdirAsync = Promise.promisify(require('fs').readdir)
const execAsync = Promise.promisify(require('child_process').exec)
