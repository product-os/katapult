katapult
========

A tool for launching container-based products

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/katapult.svg)](https://npmjs.org/package/katapult)
[![CircleCI](https://circleci.com/gh/balena-io/katapult/tree/master.svg?style=shield)](https://circleci.com/gh/balena-io/katapult/tree/master)
[![Downloads/week](https://img.shields.io/npm/dw/katapult.svg)](https://npmjs.org/package/katapult)
[![License](https://img.shields.io/npm/l/katapult.svg)](https://github.com/balena-io/katapult/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g katapult
$ katapult COMMAND
running command...
$ katapult (-v|--version|version)
katapult/0.0.0 linux-x64 node-v11.9.0
$ katapult --help [COMMAND]
USAGE
  $ katapult COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`katapult deploy -e <environment_name> -t <target_name>`](#katapult-deploy-file)
* [`katapult generate -e <environment_name> -t <target_name>`](#katapult-generate)
* [`katapult help [COMMAND]`](#katapult-help-command)

## `katapult deploy [FILE]`

Generate and deploy Deploy Spec from environment configuration

```
USAGE
  $ katapult deploy -e <environment_name> -t <target_name>

OPTIONS
  -c, --configuration=configuration            [default: ./] URI to deploy-template folder/repo
  -e, --environment=environment                (required) Name of the selected environment
  -k, --keyframe=keyframe                      [default: ./keyframe.yml] Path to keyframe file, if available

  -m, --mode=interactive|defensive|aggressive  [default: interactive] Determine how to resolve data which is missing at
                                               runtime.

  -t, --target=target                          Name of the selected target
```

_See code: [src/commands/deploy.ts](https://github.com/balena-io/katapult/blob/v0.0.0/src/commands/deploy.ts)_

## `katapult generate`

Generate Deploy Spec from environment configuration

```
USAGE
  $ katapult generate -e <environment_name> -t <target_name>

OPTIONS
  -c, --configuration=configuration            [default: ./] URI to deploy-template folder/repo
  -e, --environment=environment                (required) Name of the selected environment
  -k, --keyframe=keyframe                      [default: ./keyframe.yml] Path to keyframe file, if available

  -m, --mode=interactive|defensive|aggressive  [default: interactive] Determine how to resolve data which is missing at
                                               runtime.

  -t, --target=target                          Name of the selected target
```

_See code: [src/commands/generate.ts](https://github.com/balena-io/katapult/blob/v0.0.0/src/commands/generate.ts)_

## `katapult help [COMMAND]`

Display help for katapult

```
USAGE
  $ katapult help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.1.6/src/commands/help.ts)_
<!-- commandsstop -->
