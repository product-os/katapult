import { Command } from "@oclif/command";
import { GenerateDeployFlags } from "./generate";

import generateDeploy = require("../lib/commands/generate-deploy");

export default class Deploy extends Command {
  static description =
    "Generate Deploy Spec from environment configuration and deploy";

  static flags = GenerateDeployFlags;

  static args = [];

  async run() {
    const { flags } = this.parse(Deploy);
    flags.deploy = true;

    return generateDeploy(flags).asCallback();
  }
}
