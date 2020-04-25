package keyframe

import (
	"github.com/balena-io/katapult/cue/contract"
)

Structure :: contract.Base & {
	type: "keyframe"
	children: [...contract.Ref]
}

Data: [Name=string]: Structure & {
	slug: Name
	children: [
		...contract.Ref & {
			as:      string | *slug
			version: string
			slug:    string
		},
	]
}
