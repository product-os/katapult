import * as mustache from 'mustache';
import { ConfigMap } from '../../config-store/config-store';
import { FrameTemplateRenderer } from './index';

export const Renderer: FrameTemplateRenderer = (
	content: string,
	configMap: ConfigMap,
) => {
	configMap = {
		...configMap,
		...{
			base64: () => (input: string, render: (i: any) => string) => {
				return Buffer.from(render(input)).toString('base64');
			},
		},
	};

	return mustache.render(content, configMap);
};
