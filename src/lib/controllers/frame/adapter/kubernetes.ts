import * as _ from 'lodash';
import * as bluebird from 'bluebird';
import * as kubernetes from '../../../kubernetes';
import * as temp from 'temp';
import { fs } from 'mz';

import * as childProcess from 'child_process';
const execAsync = bluebird.promisify(childProcess.exec);

import { FrameDeployAdapter } from './index';
import { Frame } from '../frame';

export const kubernetesDeployAdapter = (): FrameDeployAdapter => {
	return {
		deploy: async (frame: Frame) => {
			const access = await kubernetes.getKubernetesAccess();
			return await access.begin(async function() {
				const bundle = Object.values(frame.files).join('\n---\n');
				const tmp = temp.track();
				const bundleFile = tmp.path();

				await fs.writeFile(bundleFile, bundle);

				await execAsync(
					`kubectl apply --kubeconfig=${
						this.accessConfig.kubeconfig
					} -f ${bundleFile}`,
				);

				await bluebird.fromCallback(callback => tmp.cleanup(callback));
			});
		},
	};
};
