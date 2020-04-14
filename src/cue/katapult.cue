package katapult

// Namespaces per product keyframe.
k8s: namespace: {
  for name, k in keyframes {
    "\(name)": {}
  }
}

// Service account per component.
k8s: serviceAccount: {
  for name, k in keyframes {
    for r in k.requires {
      "\(r.as)": {
        metadata: namespace: name
      }
    }
  }
}

// Generate services.
k8s: service: {
  for name, k in keyframes {
    for r in k.requires {
      if (contracts[r.slug].type == "sw.containerized-service" || contracts[r.slug].type == "sw.containerized-scalable-service") {
        "\(r.as)": {
          metadata: namespace: name
          spec: ports: [
            {
              name: "https"
              port: 443
              targetPort: capability.as
              protocol: capability.data.protocol | *"TCP"
            }
            for capability in contracts[r.slug].provides if capability.type == "endpoint" && capability.as == "main-endpoint"
          ]
        }
      }
    }
  }
}

// Generate deployments from keyframe.
k8s: deployment: {
  for k in keyframes {
    for r in k.requires {
      // TODO
    }
  }
}

