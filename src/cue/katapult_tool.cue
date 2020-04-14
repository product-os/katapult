package katapult

import (
  "encoding/yaml"
  "tool/cli"
)

command: dumpK8s: {
  task: print: cli.Print & {
    text: yaml.MarshalStream(k8s.all)
  }
}

command: dumpContracts: {
  task: print: cli.Print & {
    text: yaml.MarshalStream(selectedContracts)
  }
}
