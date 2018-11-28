import * as _ from "lodash";
import * as Promise from "bluebird";
import * as gitP from "simple-git/promise";
import * as yamljs from "yamljs";
import * as path from "path";
import { unwrap } from "balena-universe-cli-demo";
import { Stats } from "fs";

const { readFileAsync, statAsync } = Promise.promisifyAll(require("fs"));

function validateFilePath(path: string, raise = true) {
	return statAsync(path)
		.then((stat: Stats) => {
			if (!stat.isFile()) {
				if (raise) {
					throw new Error("Error: " + path + " is not a file");
				}
				return false;
			}
			return true;
		})
		.catch((error: Error) => {
			if (raise) throw error;
			else return false;
		});
}

function validateDirectoryPath(path: string, raise = true) {
	return statAsync(path)
		.then((stat: Stats) => {
			if (!stat.isDirectory()) {
				if (raise) {
					throw new Error("Error: " + path + " is not a directory");
				}
				return false;
			}
			return true;
		})
		.catch((error: Error) => {
			if (raise) throw error;
			else return false;
		});
}

function loadFromFile(filePath: string): Promise<any> {
	return readFileAsync(filePath, "utf8").then(yamljs.parse);
}

function validateTopLevelDirectiveYaml(name: string, yamlPath: string) {
	return loadFromFile(yamlPath).then(obj => {
		if (!_.get(obj, name)) {
			throw new Error(
				`Error parsing "${yamlPath}"\n` +
					`"${name}" not defined in "${yamlPath}"\n` +
					`Available options: ${_.keys(obj)}`
			);
		}
		return true;
	});
}

export function validateEnvironmentConfiguration(
	configurationPath: string,
	environment: string
) {
	// TODO: git validation.
	return validateDirectoryPath(configurationPath).then(() => {
		return validateTopLevelDirectiveYaml(
			environment,
			path.join(configurationPath, "environments.yml")
		).then(() => {
			return parseEnvironmentConfiguration(configurationPath, environment);
		});
	});
}

function parseEnvironmentConfiguration(
	configurationPath: string,
	environmentName: string
) {
	return loadFromFile(path.join(configurationPath, "environments.yml")).then(
		conf => {
			return _.get(conf, environmentName);
		}
	);
}

export function ensureRepoInPath(repoURI: string, repoPath: string) {
	repoURI = repoURI.trim();
	return statAsync(repoPath)
		.then((stat: Stats) => {
			if (stat.isDirectory()) {
				const repo = gitP(repoPath);
				return repo.listRemote(["--get-url"]).then(remote => {
					// Validate remotes match
					remote = remote.trim();
					if (
						remote === repoURI ||
						(_.includes(remote, repoURI) &&
							remote.replace(repoURI, "") === ".git") ||
						(_.includes(repoURI, remote) &&
							repoURI.replace(remote, "") === ".git")
					) {
						return true;
					} else {
						throw new Error(
							`Git remote: ${repoURI} doesn't match ${repoPath} existing remote: ${remote}`
						);
					}
				});
			}
			return gitP().clone(repoURI, repoPath);
		})
		.catch((err: Error) => {
			if (err.name === "ENOENT") {
				return gitP().clone(repoURI, repoPath);
			}
			throw err;
		});
}

/**
 * Wrapper of keyframe unwrapper.
 * @param keyframePaths: A list of paths for searching for a keyframe file.
 * @returns {Promise<Object | undefined>} Keyframe object
 */
export function unwrapKeyframe(
	keyframePaths: string[]
): Promise<Object | undefined> {
	return Promise.map(keyframePaths, kfPath => {
		return validateFilePath(kfPath, false);
	}).then(validPaths => {
		const keyframe = keyframePaths[validPaths.indexOf(true)];
		if (keyframe) {
			let kf = unwrap({ id: "", logLevel: {} }, keyframe);
			kf = _.filter(_.get(kf, "consists_of", []), i => {
				return i.type === "sw.containerized-application";
			});
			kf = _.mapValues(_.keyBy(kf, "slug"), o => {
				return _.merge(o.assets, { version: o.version });
			});
			return kf;
		}
	});
}
