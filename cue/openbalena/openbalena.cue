package openbalena

import (
    "github.com/product-os/katapult/cue/balenaio"
)

distribution: slug: "open-balena"
contracts: balenaio.contracts

blueprints: "\(distribution.slug)": {
	data: selector: [
		{slug: "open-balena-api"},
		{slug: "open-balena-registry"},
		{slug: "open-balena-db"},
		{slug: "open-balena-s3"},
		{slug: "balena-haproxy"},
		{slug: "balena-cert-provider"},
		{slug: "redis"},		
	],
}
