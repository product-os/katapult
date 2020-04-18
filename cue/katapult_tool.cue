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
	data: list.FlattenN([ namespaces, allNamespaced], 2)
}

command: dumpK8s: {
	task: print: cli.Print & {
		text: yaml.MarshalStream(k8sAll.data)
	}
}

command: k8sApply: {
	task: apply: exec.Run & {
		cmd: ["kubectl", "apply", "-f", "-"]
		stdin: yaml.MarshalStream(k8sAll.data)
		//stdout: string
	}
}

command: dumpContracts: {
	task: print: cli.Print & {
	    selectedContracts = [ c for c in contracts ]
		text: yaml.MarshalStream(selectedContracts)
	}
}
