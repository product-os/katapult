package productos

//TODO the compose environment needs to provide the volumes

#Contract: {
	slug: "\(namespace)/\(type)/\(name)"
	name: string
	namespace: string
	type: string
	title?: string
	requires: [...]
	provides: [...]
	data: {...}
	config: {...}
	version: string
}

let runner = #Contract & {
	name: "transformer-runner"
	namespace: "product-os"
	type: "service"
	requires: [
		{ type:"volume", data: { tag:"shared"} }
	]
	provides: [] // are these actually links to capability contracts?
	data: {
		restart:    "always"
		privileged: true
		volumeMounts: [
			{to:"/shared", from:"shared"}
		]
	}
	config: {
		REGISTRY_HOST: {value: *"registry.ly.fish.local" | string} // why the wrapper struct?
		JF_API_URL: {value: *"http://api.ly.fish.local" | string}
		JF_API_PREFIX: {value: *"api/v2" | string}
		RSA_PRIVATE_KEY: {value: *"" | string}
	} // why is this outside data?
	version: "1.1.0"
}

let launcher = #Contract & {
	name: "fleet-launcher"
	namespace: "product-os"
	type: "service"
	requires: [
		{type:"volume", tag:"shared"},
		{type:"balena-feature", capability:"supervisor-api"}, //???
	]
	provides: [] // are these actually links to capability contracts?
	data: {
		restart:    "always"
		volumeMounts: [
			{to:"/shared", from:"shared"}
		]
	}
	version: "1.1.0"
}

// this is interesting:
// the contracts above come from the service (repos), but where does
// this one come from?
let gc = #Contract & {
	name: "garbage-collector"
	namespace: "product-os"
	type: "service"
	requires: [
		{type:"volume", tag:"shared"},
		{type:"balena-feature", capability:"docker-socket"}, //???
	]
	provides: [] // are these actually links to capability contracts?
	data: {
		restart:    "always"
		volumeMounts: [
			{to:"/shared", from:"shared"}
		]
	}
	version: "1.1.0"
}

contracts: {
	"\(runner.slug)": runner
	"\(gc.slug)": gc
	"\(launcher.slug)": launcher
}
