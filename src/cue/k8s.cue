package katapult

k8sBase :: {
  apiVersion: string
  kind: "Deployment" | "Service" | "ConfigMap" | "SealedSecret" | "ServiceAccount" | "Namespace"
  metadata: {
    name: string
    ...
  }
  ...
}
k8sNamespaced :: k8sBase & {
  metadata: namespace: string
}

k8s: namespace: [Name=_]: k8sBase & {
  apiVersion: "v1"
  kind: "Namespace"
  metadata: name: Name
}

// TODO: Move all these entities inside a namespace.
k8s: serviceAccount: [Name=_]: k8sNamespaced & {
  apiVersion: "v1"
  kind: "ServiceAccount"
  metadata: name: Name
  metadata: labels: {
    "app.kubernetes.io/instance": Name
    "app.kubernetes.io/name": Name
  }
}

k8s: deployment: [Name=_]: k8sNamespaced & {
  apiVersion: "apps/v1"
  kind: "Deployment"
  metadata: name: Name
}

k8sPort:: {
  name: string
  port: number
  protocol: "TCP" | "UDP"
  targetPort: string
}

k8s: service: [Name=_]: k8sNamespaced & {
  apiVersion: "v1"
  kind: "Service"
  metadata: name: Name

  annotations?: { [string]: string }

  spec: {
    type: "LoadBalancer"
    selector: {
      "app.kubernetes.io/instance": Name
      "app.kubernetes.io/name": Name
    }
    ports: [...k8sPort]
  }
}

k8s: ["service" | "deployment" | "serviceAccount"]: [Name=_]: {
  metadata: labels: {
    "app.kubernetes.io/instance": Name
    "app.kubernetes.io/name": Name
    "app.kubernetes.io/version": "TODO"
  }
}

k8s: {
  allSets = [ k8s.namespace, k8s.serviceAccount, k8s.deployment, k8s.service ]
  all: [ x for v in allSets for x in v ]
}
