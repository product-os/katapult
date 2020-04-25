package example

import (
	"github.com/balena-io/katapult/cue/contract"
)

Data: contract.Data
Data: {
	"balena-ui": {
		type: "sw.containerized-web-service"
		requires: [
			{slug: "balena-api"},
			{slug: "balena-data"},
		]
		config: [
		    {name: "LOG_LEVEL", value: "error" | "debug" | "info"}
		]
	}

	"balena-api": {
		type: "sw.containerized-scalable-service"
		requires: [{slug: "redis"}]
		provides: [
			{type: "endpoint", data: {port: 80}, as:   "main"},
			{type: "endpoint", data: {port: 8000}, as: "metrics"},
		]
	}

	"balena-git": {
		type: "sw.containerized-service"
		requires: [{type: "hw.disk", data: {path: "/mnt/git-data"}}]
	}

	"balena-data": {
		type: "sw.containerized-scalable-service"
		requires: [{slug: "redis"}]
	}

	"redis": {
		type: "sw.datastore"
	}
}
