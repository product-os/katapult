katapult
========

A tool for launching container-based products

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@balena/katapult.svg)](https://npmjs.org/package/@balena/katapult)
[![CircleCI](https://circleci.com/gh/loop-os/katapult/tree/master.svg?style=shield)](https://circleci.com/gh/loop-os/katapult/tree/master)
[![Downloads/week](https://img.shields.io/npm/dw/@balena/katapult.svg)](https://npmjs.org/package/@balena/katapult)
[![License](https://img.shields.io/npm/l/@balena/katapult.svg)](https://github.com/loop-os/katapult/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @balena/katapult
$ katapult COMMAND
running command...
$ katapult (-v|--version|version)
@balena/katapult/2.1.1 linux-x64 node-v12.13.1
$ katapult --help [COMMAND]
USAGE
  $ katapult COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`katapult deploy`](#katapult-deploy)
* [`katapult generate`](#katapult-generate)
* [`katapult help [COMMAND]`](#katapult-help-command)

## `katapult deploy`

Deploy a Frame from an Environment to a Target

```
USAGE
  $ katapult deploy

OPTIONS
  -e, --environmentPath=environmentPath   (required) [default: ./environment.yml] URI of the environment configuration
                                          path

  -k, --keyframe=keyframe                 URI of the keyframe path

  -t, --target=docker-compose|kubernetes  (required) Which target to use.
```

_See code: [src/commands/deploy.ts](https://github.com/loop-os/katapult/blob/v2.1.1/src/commands/deploy.ts)_

## `katapult generate`

Generate a Frame from an Environment

```
USAGE
  $ katapult generate

OPTIONS
  -e, --environmentPath=environmentPath   (required) [default: ./environment.yml] URI of the environment configuration
                                          path

  -k, --keyframe=keyframe                 URI of the keyframe path

  -o, --outputPath=outputPath             (required) Directory to output the frame to

  -t, --target=docker-compose|kubernetes  (required) Which target to use.
```

_See code: [src/commands/generate.ts](https://github.com/loop-os/katapult/blob/v2.1.1/src/commands/generate.ts)_

## `katapult help [COMMAND]`

display help for katapult

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
