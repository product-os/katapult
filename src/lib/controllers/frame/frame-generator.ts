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

import { ConfigStore } from '../config-store/config-store';
import { Frame, createFrame } from './frame';
import { FrameTemplate } from '../frame-template';
import {
	FrameTemplateRenderer,
	prepareRenderer,
} from '../frame-template/renderer';

/**
 * generate
 *
 * Used for generating a Frame. A Frame is the resulting output after rendering the frame templates using data
 * from the config stores.
 */
export async function generate(
	frameTemplate: FrameTemplate,
	frameTemplateRenderer: FrameTemplateRenderer,
	configStore: ConfigStore,
): Promise<Frame> {
	const configMap = await configStore.list();
	const templateRenderer = prepareRenderer(frameTemplateRenderer, configMap);
	return {
		...templateRenderer.renderTemplate(frameTemplate),
		...{ configMap },
	};
}
