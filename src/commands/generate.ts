import { Command, flags } from "@oclif/command";

import generateDeploy = require("../lib/commands/generate-deploy");

export const GenerateDeployFlags = {
  configuration: flags.string({
    description: "URI to deploy-template folder/repo",
    default: "./",
    char: "c"
  }),

  environment: flags.string({
    description: "Name of the selected environment",
    required: true,
    char: "e"
  }),

  target: flags.string({
    description: "Name of the selected target",
    char: "t"
  }),

  mode: flags.string({
    description: "Determine how to resolve data which is missing at runtime.",
    options: ["interactive", "defensive", "aggressive"],
    default: "aggressive",
    char: "m"
  }),

  keyframe: flags.string({
    description: "Path to keyframe file, if available",
    default: "./keyframe.yml",
    char: "k"
  }),

  format: flags.string({
    name: "service-format",
    description:
      "Determine how a component should be acquired; build or image. Formated as 'component=format', eg 'haproxy=build'",
    char: "k",
    multiple: true
  }),

  path: flags.string({
    name: "build-path",
    description:
      "Build path for a component as: --build-path <component>=<path>",
    char: "b",
    multiple: true
  }),

  deploy: flags.boolean({
    hidden: true,
    default: false
  })
};

export default class Generate extends Command {
  static description = "Generate Deploy Spec from environment configuration";

  static flags = GenerateDeployFlags;

  static args = [];

  async run() {
    const { flags } = this.parse(Generate);
    return generateDeploy(flags).asCallback();
  }
}
