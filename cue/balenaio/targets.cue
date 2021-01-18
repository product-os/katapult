package balenaio

import (
    "github.com/product-os/katapult/cue/contract"
)

targets: contract.targets

targets: {
    "compose": {
        slug: "compose"
        type: "target"
        version: "v0.1"
        requires: [
            { type: "sw.docker-compose" version:"v3.0.0" }
        ]
        provides: [
            { type: "net.loadbalancer", slug: "balena-haproxy" }
        ]
    }
}