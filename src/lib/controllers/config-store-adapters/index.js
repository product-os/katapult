'use strict'

module.exports = {
	'docker-compose': require('./compose'),
	compose: require('./compose'),
	balena: require('./compose'),
	kubernetes: require('./kubernetes')
}
