# katapult

A tool for launching!

This cli tool consumes a repo of declarative yaml docker-compose format configuration layers.
The input options require specifying mode, target and environment from for the available declarative yaml configuratio nlayers,
generating deployment configuration for/or applying it in various environments and targets.
This cli tool validates input options to the declarative yaml docker-compose format configuration repo.

### Input options
- mode refers to the functionality of balena-cloud variant:
    - production
    - onprem
    - open
    - development
- target refers to the target deployment environment:
    - docker-compose
    - kubernetes on AWS (own managed EC2 kubernetes cluster or EKS)
    - kubernetes on GKE
    - kubernetes locally
- environment refers to specific environment variables/secrets values or default value overrides per end environment:
    - secrets
    - environment variables
- output: Destination path for writing the output configuration. Optional, defaults to stdout.

Specific options required for applying the output configuration TBA/refined (ex: kubectl config path etc).

### Output
The tool should at its first version be exporting ready to deploy configuration for the specified input options. That could be a docker-compose.yml file, kubernetes manifest, etc.
[katapult](https://github.com/resin-io/katapult) will generates a kompose file, for use as docker-compose.yml file or input to [kompose](https://github.com/kubernetes/kompose) for kubernetes targets.
