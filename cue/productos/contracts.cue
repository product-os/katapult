package productos

contracts: {
	"jellyfish-action-server": {
		name: "Jellyfish Action Server"
		slug: "jellyfish-action-server"
		type: "sw.containerized-service"
		requires: []
		provides: []
		data: {
			assets: {
				image: url: "balena/jellyfish-action-server:33.50.5"
				repo: {
					https: "https://github.com/balena-io/jellyfish.git"
					ssh: "git@github.com:product-os/jellyfish.git"
				}
			}
		}
		version: "33.50.5"
	},
	"jellyfish-api": {
		name: "Jellyfish API Server"
		slug: "jellyfish-api"
		type: "sw.containerized-service"
		requires: [
			{ type: "healthcheck", data: { interval: "30s", retries: 5, url: "http://localhost:80/health" } }
		]
		provides: []
		data: {
			assets: {
				image: url: "balena/jellyfish"
				repo: {
					https: "https://github.com/balena-io/jellyfish.git"
					ssh: "git@github.com:product-os/jellyfish.git"
				}
			}
		}
		version: "28.13.1"
	},
	"jellyfish-livechat": {
		name: "The Jellyfish Livechat App"
		slug: "jellyfish-livechat"
		type: "sw.containerized-service"
		requires: []
		provides: []
		data: {
			assets: {
				image: url: "balena/jellyfish-tick-server"
				repo: {
					https: "https://github.com/balena-io/jellyfish.git"
					ssh: "git@github.com:product-os/jellyfish.git"
				}
			}
		}
		version: "28.13.1"
	},
	"jellyfish-tick-server": {
		name: "Jellyfish Tick Server"
		slug: "jellyfish-tick-server"
		type: "sw.containerized-service"
		requires: []
		provides: []
		data: {
			assets: {
				image: url: "balena/jellyfish-tick-server"
				repo: {
					https: "https://github.com/balena-io/jellyfish.git"
					ssh: "git@github.com:product-os/jellyfish.git"
				}
			}
		}
		version: "28.13.1"
	},
	"jellyfish-ui": {
		name: "Jellyfish UI"
		slug: "jellyfish-ui"
		type: "sw.containerized-service"
		requires: []
		provides: []
		data: {
			assets: {
				image: url: "balena/jellyfish-ui"
				repo: {
					https: "https://github.com/balena-io/jellyfish.git"
					ssh: "git@github.com:product-os/jellyfish.git"
				}
			}
		}
		version: "28.13.1"
	}
}
