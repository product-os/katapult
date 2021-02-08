package katapult

import (
    "github.com/product-os/katapult/cue/contract"
	"github.com/product-os/katapult/cue/environment"
)

contracts: [Name=string]: contract.#Contract
contracts: environment.contracts

keyframes: [Name=string]: contract.#Keyframe & {
	slug: "\(Name)-keyframe"
} 

blueprints: [Name=string]: contract.#Blueprint & {
	slug: "\(Name)-blueprint"
}
blueprints: environment.blueprints

input: {
	product: string
	environment: string
	config: {...}
}

configs: [Name=string]: contract.#Contract & {}