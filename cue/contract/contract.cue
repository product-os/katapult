package contract

import "list"

Base: {
	type?: string
	slug?: string
	data?: {...}
}

// Possible references to this location:
// contract/contract.cue:40:17
#Ref: Base & {
	as?:          string
	cardinality?: string
	version?:     string
}
Ref: #Ref @tmpNoExportNewDef(2170)

capabilityType: [Name=string]: Base & {
	type: Name
}

capabilityType: endpoint: {
	data: {
		port:     uint | *8000
		protocol: "TCP" | "UDP" | *"TCP"
	}
}
#Structure: Base & {
	type: string
	slug: string

	requires?: [...#Ref]
	provides?: [...#Ref]

	// TODO: Work on the config.
	config?: [...{name: string, required: bool | *true, value: _}]

	// Default capabilities inferred from the type.
	if (list.Contains(ServiceTypes, type)) {
		provides: [...Ref] | *[capabilityType.endpoint & {as: "main"}]
	}
}

Data: [Name=string]: #Structure & {
	slug: Name
}
