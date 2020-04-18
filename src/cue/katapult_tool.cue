package katapult

import (
	"encoding/yaml"
	"tool/cli"
	"tool/exec"
)

command: dumpK8s: {
	task: print: cli.Print & {
		text: yaml.MarshalStream(k8s.all)
	}
}

command: k8sApply: {
	task: apply: exec.Run & {
		cmd: ["kubectl", "apply", "-f", "-"]
		stdin: yaml.MarshalStream(k8s.all)
		//stdout: string
	}
}

command: dumpContracts: {
	task: print: cli.Print & {
		text: yaml.MarshalStream(selectedContracts)
	}
}
