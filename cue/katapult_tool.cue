package katapult

import (
	"encoding/yaml"
	"list"
	"tool/cli"
	"tool/exec"
)

k8sAll: {
	allNamespaced = [ spec for nsData in k8sData.d for kindData in nsData for spec in kindData ]
	namespaces = [ spec for spec in k8sData.namespace ]
	data: list.FlattenN([namespaces, allNamespaced], 2)
}

useExample = {
  var: example: bool
  flag: example: {
    description: "use examples"
  }
}

command: dumpK8s: useExample & {
	task: print: cli.Print & {
		text: yaml.MarshalStream(k8sAll.data)
	}
}

command: k8sApply: useExample & {
	task: apply: exec.Run & {
		cmd: ["kubectl", "apply", "-f", "-"]
		stdin: yaml.MarshalStream(k8sAll.data)
	}
}

command: dumpContracts: useExample & {
	task: print: cli.Print & {
		selectedContracts = [ c for c in contracts ]
		text: yaml.MarshalStream(selectedContracts)
	}
}
