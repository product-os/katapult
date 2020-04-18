package katapult

import (
    "list"

    "github.com/balena-io/katapult/cue/contract"
    cExample "github.com/balena-io/katapult/cue/contract/example"
    "github.com/balena-io/katapult/cue/adapter/k8s"
    "github.com/balena-io/katapult/cue/adapter/k8s/aws"
    "github.com/balena-io/katapult/cue/keyframe"
    kExample "github.com/balena-io/katapult/cue/keyframe/example"
)

contracts: contract.Data
contracts: cExample.Data

keyframes: keyframe.Data
keyframes: kExample.Data

k8sData: k8s.Data & aws.Data

k8sData: d: [Namespace=_]: {
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

            if (list.Contains(contract.ServiceTypes, componentType)) {
                "\(componentRef.as)": spec: {
                    httpsPorts = [
                        {
                            name:       "https"
                            port:       443
                            targetPort: capability.as
                            protocol:   capability.data.protocol | *"TCP"
                        }
                        for capability in component.provides if capability.type == "endpoint" && capability.as == "main"
                    ]
                    httpPorts = [
                        {
                            name:       "http"
                            port:       80
                            targetPort: "main" // TODO: Derive from the capability.
                            protocol:   "TCP"
                        } if list.Contains(httpExposedTypes, componentType)
                    ]
                    ports: list.FlattenN([httpsPorts, httpPorts], 2)
                }
            }
        }

        // Deployment per service component.
        deployment: {
            if (list.Contains(contract.ServiceTypes, componentType)) {
                "\(componentRef.as)": {
                    spec: template: spec: containers: [{
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

// TODO: Move the transformation to the adapter package.
for name, k in keyframes {

	// Namespaces per product keyframe.
	k8sData: namespace: {
		"\(name)": {}
	}

	k8sData: d: "\(name)": {

	}
}
