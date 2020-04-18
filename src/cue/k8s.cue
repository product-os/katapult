package katapult

import (
	"list"
	"strings"
)

namespace :: string

k8sBase :: {
	apiVersion: string
	kind:       "Deployment" | "Service" | "ConfigMap" | "SealedSecret" | "ServiceAccount" | "Namespace"
	metadata: {
		name: string
		...
	}
	...
}

// Common namespace data layout.

k8s: namespace: [Name=_]: k8sBase & {
	apiVersion: "v1"
	kind:       "Namespace"
	metadata: name: Name
}

// Common parts of definitions that belong to a namespace.

k8sNamespaced :: k8sBase & {
	metadata: namespace: string
}

k8s: d: [Namespace=_]: [string]: [Name=_]: k8sNamespaced & {
	metadata: namespace: Namespace
	metadata: name:      Name
	metadata: labels: {
		"app.kubernetes.io/instance": Name
		"app.kubernetes.io/name":     Name
		"app.kubernetes.io/version":  "TODO"
	}
}

for kindName in ["deployment", "service", "serviceAccount"] {
	k8s: d: [namespace]: "\(kindName)": [string]: k8sNamespaced & {
		apiVersion: string | *"v1"
		kind:       strings.ToTitle(kindName)
	}
}

containerPort :: {
	containerPort: number
	name:          string
	protocol:      *"TCP" | "UDP"
}

k8s: d: [namespace]: deployment: [Name=_]: {
	apiVersion: "apps/v1"
	labelsData = {
		"app.kubernetes.io/instance": Name
		"app.kubernetes.io/name":     Name
	}
	spec: {
		selector: matchLabels: labelsData
		template: {
			metadata: labels: labelsData
			spec: {
				terminationGracePeriodSeconds: 60
				imagePullSecrets: [{name: "image-pull-secret"}]
				serviceAccountName: Name
				containers: [{
					name:            Name
					imagePullPolicy: "IfNotPresent"
					//image: string

					ports: [...containerPort]

					probe :: {
						httpGet: {
							path:   "/ping"
							port:   "main-endpoint"
							scheme: "HTTP"
						}
						periodSeconds: int
						...
					}
					livenessProbe: probe & {
						initialDelaySeconds: 60
						periodSeconds:       6
						timeoutSeconds:      5
					}
					readinessProbe: probe & {
						failureThreshold: 6
						periodSeconds:    10
					}
					// TODO: env, volumes, logging
				}]
			}
		}
	}
}

k8sPort :: {
	name:       string
	port:       number
	protocol:   "TCP" | "UDP"
	targetPort: string
}

k8s: d: [namespace]: service: [Name=_]: spec: {
	type: "LoadBalancer"
	selector: {
		"app.kubernetes.io/instance": Name
		"app.kubernetes.io/name":     Name
	}
	ports: [...k8sPort]
}

k8s: {
	allNamespaced = [ spec for nsData in k8s.d for kindData in nsData for spec in kindData ]
	namespaces = [ spec for spec in k8s.namespace ]
	all: list.FlattenN([ namespaces, allNamespaced], 2)
}
