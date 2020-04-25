package example

import "github.com/balena-io/katapult/cue/keyframe"

Data: keyframe.Data
Data: "balena-cloud": {
	children: [
		{slug: "balena-api", version:  "v1.2.3"},
		{slug: "balena-ui", version:   "v2.2.3"},
		{slug: "balena-data", version: "v3.2.3"},
		{slug: "balena-git", version:  "v4.2.3"},
		{slug: "ebs-disk", as:         "git-volume", version: "v5.2.3"},
		{slug: "redis", as:            "api-redis", version:  "v6.2.3"},
		{slug: "redis", as:            "data-redis", version: "v7.2.3"},
	]
}
