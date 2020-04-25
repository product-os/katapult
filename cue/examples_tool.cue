package katapult

import (
	cExample "github.com/balena-io/katapult/cue/contract/example"
	kExample "github.com/balena-io/katapult/cue/keyframe/example"
)

for cmd in ["dumpK8s", "k8sApply", "dumpContracts"] {
  if (command[cmd].var.example) {
    contracts: cExample.Data
    keyframes: kExample.Data
  }
}
