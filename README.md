## katapult

A tool for launching!

The aim of this tool, is to produce final deployable artifacts (`deploy-spec`),
tightly specifying all components and configuration, as well as anything else
required to be directly deployable with no further processing. To that end,
katapult uses a `deploy-templates` folder containing definitions of environments
along with their deploy-targets, and target-specific deploy-manifest templates
and configuration specs. References to a config-store containing values for an
actual environment deployment instantiation are also included. Values from the
`config-store` are used for transforming `deploy-templates` definitions to
`deploy-specs`.


This cli tool consumes a `deploy-templates` folder with the following example
structure:
```
deploy-templates/
├── environment-name/
│   └── version/
│       └── target/
│           ├── config-manifest.yml
│           └── templates/
│               └── docker-compose.tpl.yml
└── environments.yml
```

- `environment-name/`: Folder containing environment deployment and
configuration specs.
- `target/`: Contains deployment and configuration specs for a specific target.
- `config-manifest.yml`: Specifies the schema of the environment configuration.
- `templates/`:  Folder containing deployment spec templates in
[mustache](https://mustache.github.io/) format, bearing extension `.tpl.ext`
(ext may be `.yml` for example for docker-compose or kubernetes targets).
- `environment.yml`: A file declaring available environments.


###### `environment.yml`

Current format of the file follows:

`environments.yml`:
```
environment-name:
  version: vX.Y.Z
  target-name:
    template: /path/to/folder/containing/deploy-templates
    config-store: /path/to/config/store
  archive-store: /path/to/archive/store
```
Paths declared in `environments.yml` may be absolute or relative to that file.

Sample `environments.yml` content, for declaring a `development` environment
with a `docker-compose` target:
```
development:
  version: v1.0.0
  docker-compose:
    template: development/v1.0.0/docker-compose/templates/
    config-store: development/v1.0.0/docker-compose/environment.env
  archive-store: /path/to/archive/store
```

Sample `docker-compose` environment folder:
```
├── config-manifest.yml
├── environment.env
└── templates
    └── docker-compose.tpl.yml
```

In this example, environment.env is included in target folder, but could be
anywhere.

###### `config-manifest.yml`

The config manifest defines the spec for an environment configuration, in a DSL
schema. Generators under `default` keyword may be included, for allowing
auto-generating values.
[More info link TBA](#)

###### `archive-store`

The path/URI for storing the product deploy artifacts.

### Commands

Usage: `katapult <command> [OPTIONS] <params>`

##### generate

Generates the deploy spec from environment configuration

###### generate options

`--configuration`: URI to deploy-template folder/repo

`--environment`: Name of the environment to act on.

`--target`: Target name

`--mode`: There are 3 valid values for mode:
- interactive (default): When required values are not available or valid,
prompt the user for input.
- defensive: No action is taken when configuration validation errors occur.
We fail with an informative error message.
- aggressive: Automatically generates missing or invalid values when
configuration validation fails.

`--keyframe`: path to keyframe file, if available. Defaults to `./keyframe.yml`.

`--service-format`: Service format for a component as: --service-format
`<component>=<format>`. Format could be either 'image' (component will use a
pre-built Docker image) or 'build' (component will build the Docker image from
local sources). Defaults to image for all components.

`--build-path`: build path for a component as: --build-path
`<component>=<path>`. Defaults to `./component-name`

`--verbose`: Enable verbose mode

##### deploy
Generates deploy spec from environment configuration, and invokes a deployment
to the specified `--target`.

###### deploy options
They are same with [generate command options](./README.md#generate-options)
above

##### help
Outputs help
