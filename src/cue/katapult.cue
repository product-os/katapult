package katapult

import "list"

for name, k in keyframes {

	// Namespaces per product keyframe.
	k8s: namespace: {
		"\(name)": {}
	}

	k8s: d: "\(name)": {
		for componentRef in k.children {
			component = contracts[componentRef.slug]
			componentType = component.type

			// Service account per component.
			serviceAccount: {
				for componentRef in k.children {
					"\(componentRef.as)": {}
				}
			}

			// Services for corresponding component types.
			service: {
				httpExposedTypes = [
					"sw.containerized-web-service",
				]

				if (list.Contains(serviceTypes, componentType)) {
					"\(componentRef.as)": spec: {
						httpsPorts = [
							{
								name:       "https"
								port:       443
								targetPort: capability.as
								protocol:   capability.data.protocol | *"TCP"
							}
							for capability in component.provides if capability.type == "endpoint" && capability.as == "main-endpoint"
						]
						httpPorts = [
							{
								name:       "http"
								port:       80
								targetPort: "main-endpoint" // TODO: Derive from the capability.
								protocol:   "TCP"
							} if list.Contains(httpExposedTypes, componentType)
						]
						ports: list.FlattenN([httpsPorts, httpPorts], 2)
					}
				}
			}

			// Deployment per service component.
			deployment: {
				if (list.Contains(serviceTypes, componentType)) {
					"\(componentRef.as)": {
						template: spec: containers: [{
							image: "balena/\(component.slug):\(componentRef.version)"
							ports: [
								{
									containerPort: capability.data.port
									name:          capability.as
									protocol:      capability.data.protocol | *"TCP"
								} for capability in component.provides if capability.type == "endpoint"
							]
						}]
					}
				}
			}
		}
	}
}
