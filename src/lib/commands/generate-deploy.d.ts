import * as Bluebird from "bluebird";
import * as types from "./index";

declare function generateDeploy(args: types.GenerateArgs): Bluebird<void>;
export = generateDeploy;
