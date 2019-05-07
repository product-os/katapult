import { expect, test } from "@oclif/test"
import * as path from "path"

describe("generate", () => {
  test
    .stdout()
    .command(["generate"])
    .exit(2)
    .it("exists with an error code 2 with missing required flags")

  test
    .stdout()
    .command([
      "generate",
      "-c",
      path.normalize(__dirname + "/../deploy-templates"),
      "-e",
      "openbalena",
      "-t",
      "docker-compose",
      "-m",
      "aggressive"
    ])
    .timeout(500000)
    .it("runs OK with good values", ctx => {
      expect(ctx.stdout).to.contain("Done...")
    })
})
