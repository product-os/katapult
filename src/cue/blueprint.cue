package katapult

Blueprint :: Contract & {
	type: "blueprint"
	data: {
		selector: [...ref]
		links: {
			// TODO
			...
		}
	}
}

blueprint: Blueprint & {
	slug: "balena-blueprint"
}

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

Keyframe :: contractBase & {
	type: "keyframe"
	children: [...ref]
}

keyframes: [Name=_]: Keyframe & {
	slug:     Name
	children: [
			{
			as:          sel.as
			cardinality: sel.as
			data?:       sel.data
			version:     string
			slug:        string
		}
		for sel in blueprints[Name].data.selector
	]
	data: links: blueprints[Name].data.links
}

keyframes: "balena-cloud": {
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
