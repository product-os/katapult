package katapult

import "list"

contractBase: {
  type?: string
  slug?: string
  data?: { ... }
}

ref :: contractBase & {
  as?: string
  cardinality?: string
  version?: string
}

capabilityType: [Name=_]: contractBase & {
  type: Name
}

capabilityType: endpoint: {
  data: {
    port: uint | *3000
    protocol: "TCP" | "UDP" | *"TCP"
  }
}

serviceTypes :: [
    "sw.containerized-service",
    "sw.containerized-scalable-service",
    "sw.containerized-web-service"
]

Contract :: contractBase & {
  type: string
  slug: string

  requires?: [...ref]
  provides?: [...ref]

  // Default capabilities inferred from the type.
  if (list.Contains(serviceTypes, type)) {
    provides: [...ref] | *[capabilityType.endpoint & { as: "main-endpoint" }]
  }
}

contracts: [Name=_]: Contract & {
  slug: Name
}

// Contracts data is added with the import script.
contracts: {
  "balena-ui": {
    type: "sw.containerized-web-service",
    requires: [
      { slug: "balena-api" },
      { slug: "balena-data" }
    ]
  }

  "balena-api": {
    type: "sw.containerized-scalable-service"
    requires: [{ slug: "redis" }]
    provides: [
      { type: "endpoint", data: { portNumber: 80 }, as: "main-endpoint" },
      { type: "endpoint", data: { portNumber: 8000 }, as: "metrics-endpoint" }
    ]
  }

  "balena-git": {
    type: "sw.containerized-service"
    requires: [{ type: "hw.disk", data: {path: "/mnt/git-data"}}]
  }

  "balena-data": {
    type: "sw.containerized-scalable-service"
     requires: [{ slug: "redis" }]
  }

  "redis": {
    type: "sw.datastore"
  }
}

selectedContracts: [ c for c in contracts ]
