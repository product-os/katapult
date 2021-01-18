package katapult

import (
    "github.com/product-os/katapult/cue/contract"
)

contracts: contract.contracts
keyframes: contract.keyframes
blueprints: contract.blueprints
distribution: slug: string
input: {}
composes: {}

for name, blueprint in blueprints {

    keyframes: "\(name)": {
        slug: name,
        children: [
            for ref in blueprint.data.selector {
                let _contract = contracts[ref.slug]

                slug: _contract.slug
                version: _contract.version
                type: _contract.type
            }
        ]
    }
}