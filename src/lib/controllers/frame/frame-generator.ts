/*
Copyright 2019 Balena Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import * as _ from 'lodash';
import * as fs from 'mz/fs';
import * as path from 'path';

import { ConfigStore } from '../config-store/config-store';
import { ConfigManifest } from '../config-manifest/config-manifest';
import { Frame } from './frame';
import { FrameTemplate } from './frame-template';

/**
 * generate
 *
 * Used for generating a Frame. A Frame is the resulting output after rendering the frame templates using data
 * from the config stores.
 */
export async function generate(
	frameTemplate: FrameTemplate,
	configManifest: ConfigManifest,
	configStore: ConfigStore,
): Promise<Frame> {
	const target = _.keys(this.environment.deployTarget)[0];
	const templatesPath = path.join('deploy', target, 'templates');
	const templateFilePaths = await listUri({
		uri: this.environment.productRepo,
		path: templatesPath,
	});
	const release: Release = {};
	for (const file of templateFilePaths) {
		const template = await readFromUri({
			uri: this.environment.productRepo,
			path: path.join(templatesPath, file),
		});
		const manifestPath = path.join(
			target,
			path.basename(file).replace('.tpl.', '.'),
		);
		release[manifestPath] = render(template, this.configMap);
	}
	console.log('Generated artifacts');
	return release;
}
