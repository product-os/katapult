package npm

import (
	"github.com/balena-io/katapult/cue/keyframe"
)

// Basic npm package schema.
package: [Name=string]: {
	name:    string & Name
	version: string
	dependencies: [string]: {
		version: string
		dev?:    bool
	}
}

// Transform package-lock.json into a keyframe.
KeyframeData: keyframe.Data

for name, p in package {
	KeyframeData: "\(name)": {
		children: [
				{slug: depName, version: dep.version}
				for depName, dep in p.dependencies if !dep.dev
		]
	}
}
