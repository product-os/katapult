package contract

import "list"

Base: {
	type?: string
	slug?: string
	data?: {...}
}

#Ref: Base & {
	as?:          string
	cardinality?: string
	version?:     string
}

// TODO: flesh out contract and contract reference types
#HwDiskRef: #Ref & {
	type: "hw.disk",
	data: {
		target: string
	}
}

capabilityType: [Name=string]: Base & {
	type: Name
}

capabilityType: endpoint: {
	data: {
		port:     uint | *8000
		protocol: "TCP" | "UDP" | *"TCP"
	}
}

#Contract: Base & {
	type: string
	slug: string
	version: string

	requires: [...#Ref]
	provides?: [...#Ref]

	// TODO: Work on the config.
	config?: [string]: {required: bool | *true, value: _}

	// Default capabilities inferred from the type.
	if (list.Contains(ServiceTypes, type)) {
		provides: [...#Ref] | *[capabilityType.endpoint & {as: "main"}]
	}
}

contracts: [Name=string]: #Contract