package example

import "github.com/balena-io/katapult/cue/keyframe"

Data: keyframe.Data
Data: "balena-cloud": {
	children: [
		{slug: "balena-api", version:  "TODO"},
		{slug: "balena-ui", version:   "TODO"},
		{slug: "balena-data", version: "TODO"},
		{slug: "balena-git", version:  "TODO"},
		{slug: "ebs-disk", as:         "git-volume", version: "TODO"},
		{slug: "redis", as:            "api-redis", version:  "TODO"},
		{slug: "redis", as:            "data-redis", version: "TODO"},
	]
}
