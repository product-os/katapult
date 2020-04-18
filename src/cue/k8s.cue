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

k8s: d: [namespace]: deployment: [string]: {
	apiVersion: "apps/v1"
}

k8sPort :: {
	name:       string
	port:       number
	protocol:   "TCP" | "UDP"
	targetPort: string
}

k8s: d: [namespace]: service: [Name=_]: {
	annotations?: {[string]: string}

	spec: {
		type: "LoadBalancer"
		selector: {
			"app.kubernetes.io/instance": Name
			"app.kubernetes.io/name":     Name
		}
		ports: [...k8sPort]
	}
}

k8s: {
	allNamespaced = [] // data for data in k8s.d[ns] for ns, _ in k8s.d
	allSets = list.FlattenN([ k8s.namespace, allNamespaced], 2)
	all: [ x for v in allSets for x in v ]
}
