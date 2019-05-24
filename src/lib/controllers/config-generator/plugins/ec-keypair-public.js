'use strict'
const crypto = require('crypto')
const { base64decode } = require('../filter-functions')

module.exports = keypair => {
    return (JSON.parse(base64decode(keypair))).publicKey;
}
