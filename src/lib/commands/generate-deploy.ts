import * as _ from 'lodash';
import * as path from 'path';
import DeploySpec = require('../controllers/deploy-spec');

import Utils = require('../utils');
const { validateEnvironmentConfiguration, unwrapKeyframe } = Utils;
import {
	getDeployAdapter,
	AvailableDeployAdapters,
} from '../controllers/deploy-adapters';

export function generateDeploy(args: any) {
	const {
		target,
		configuration,
		environment,
		mode = 'interactive',
		deploy = false,
		keyframe,
		buildComponents,
		verbose = false,
	} = args;

	// Validate and process environment info
	return validateEnvironmentConfiguration(configuration, environment)
		.then((environmentObj: any) => {
			if (target) {
				if (!_.has(AvailableDeployAdapters, target)) {
					throw new Error(
						'Target not implemented. \nAvailable options: ' +
							String(_.keys(AvailableDeployAdapters)),
					);
				}
				environmentObj = _.pick(environmentObj, [
					target,
					'archive-store',
					'version',
				]);
			}
			// keyframe paths in asc priority order. The first available is used
			let kfPaths = [
				keyframe,
				path.join(process.cwd(), 'keyframe.yml'),
				path.join(process.cwd(), 'keyframe.yaml'),
				path.join(configuration, 'keyframe.yml'),
				path.join(configuration, 'keyframe.yaml'),
			];

			return unwrapKeyframe(kfPaths).then((kf: any) => {
				return new DeploySpec({
					environmentName: environment,
					configBasePath: configuration,
					keyframe: kf,
					mode,
					buildComponents,
					environmentObj,
					verbose,
				})
					.generate()
					.then(() => {
						if (deploy) {
							return getDeployAdapter(target, {
								environmentName: environment,
								environmentObj,
							}).run();
						}
					});
			});
		})
		.then(() => {
			console.log('Done...');
		});
}
