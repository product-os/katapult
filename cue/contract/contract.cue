package contract

// import "list"

#Base: {
	type?: string
	slug?: string
	data?: {...}
	...
}

#Ref: #Base & {
	as?:          string
	cardinality?: string
	version?:     string
}

capabilityType: [Name=string]: {
	type: Name
}

capabilityType: endpoint: {
	data: {
		port:     uint | *8000
		protocol: "TCP" | "UDP" | *"TCP"
	}
}

#Contract: {

	type: string
	name?: string	
	slug: string
	version: string
	
	data: {...}
	requires: [...#Ref]
	provides: [...#Ref]	
	config: [string]: {required: bool | *true, value: _}

	// Default capabilities inferred from the type.
	// if (list.Contains(ServiceTypes, type)) {
	// 	provides: [...#Ref] | *[capabilityType.endpoint & {as: "main"}]
	// }
}

#SwContainerizedService: #Contract & {
	type: "sw.containerized-service"
	data: close({
		replicas: *1 | number
		assets: {			
			image: url: string
			repo: {
				https: string
				ssh: string
			}
		}
	})
}

#DiskRef: #Ref & {
	type: "disk",
	data: close({
		name: string
		target: string
		readonly: string
	})
}

#HealthcheckRef: #Ref & {
	type: "healthcheck"
	data: close({
		interval: string
		retries: number
		timeout: string
		test: [...string]
	})
}