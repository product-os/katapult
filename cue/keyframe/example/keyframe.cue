package example

import "github.com/balena-io/katapult/cue/keyframe"

Data: keyframe.Data
Data: "balena-cloud": {
	children: [
		{slug: "balena-api", version:  "v1.2.3", type: "sw.containerized-scaled-service"},
		{slug: "balena-ui", version:   "v2.2.3", type: "sw.containerized-scaled-service"},
		{slug: "balena-data", version: "v3.2.3", type: "sw.containerized-scaled-service"},
		{slug: "balena-git", version:  "v4.2.3", type: "sw.containerized-service"},
		{slug: "ebs-disk", version:    "v5.2.3", type: "hw.disk", as:      "git-volume"},
		{slug: "redis", version:       "v6.2.3", type: "sw.datastore", as: "api-redis"},
		{slug: "redis", version:       "v7.2.3", type: "sw.datastore", as: "data-redis"},
	]
	links: {
		"balena-ui": {
			"balena-api": "balena-api"
		}
		"balena-api": {
			"redis": "api-redis"
		}
		"balena-data": {
			"redis": "data-redis"
		}
		"balena-git": {
			"disk": "git-volume"
		}
	}
}
