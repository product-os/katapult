package contract

import "list"

Base: {
	type?: string
	slug?: string
	data?: {...}
}

Ref :: Base & {
	as?:          string
	cardinality?: string
	version?:     string
}

capabilityType: [Name=_]: Base & {
	type: Name
}

capabilityType: endpoint: {
	data: {
		port:     uint | *8000
		protocol: "TCP" | "UDP" | *"TCP"
	}
}

Structure :: Base & {
	type: string
	slug: string

	requires?: [...Ref]
	provides?: [...Ref]

	// Default capabilities inferred from the type.
	if (list.Contains(ServiceTypes, type)) {
		provides: [...Ref] | *[capabilityType.endpoint & {as: "main"}]
	}
}

Data: [Name=_]: Structure & {
	slug: Name
}
