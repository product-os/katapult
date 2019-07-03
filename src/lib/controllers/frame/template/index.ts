import { ConfigMap } from '../../config-store/config-store';

export type FrameTemplateRenderer = (
	content: string,
	configMap: ConfigMap,
) => string;

export const build = (render: FrameTemplateRenderer, configMap: ConfigMap) => {
	return {
		render: (content: string) => render(content, configMap),
	};
};
