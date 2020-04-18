package example

blueprints: "balena-cloud": {
	data: selector: [
		{slug: "balena-api", as:       "api", version: "^1.3.0", cardinality: "1"},
		{slug: "balena-ui", as:        "ui"},
		{slug: "balena-data", as:      "data"},
		{slug: "balena-git", as:       "git"},
		{type: "hw.disk", cardinality: "*", as: "git-volume"},
		{slug: "redis", as:            "api-redis"},
		{slug: "redis", as:            "data-redis"},
	]
	data: links: {
		ui: {
			"balena-api":  "balena-api"
			"balena-data": "data"
		}
		"balena-api": {
			"redis": "api-redis"
		}
		data: {
			"redis": "data-redis"
		}
		git: {
			"disk": "git-volume"
		}
	}
}
