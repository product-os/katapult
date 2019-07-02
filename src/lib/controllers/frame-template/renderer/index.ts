import { ConfigMap } from '../../config-store/config-store';
import { Frame, createFrame } from '../../frame/frame';
import { FrameTemplate } from '..';

export type FrameTemplateRenderer = (
	content: string,
	configMap: ConfigMap,
) => string;

export interface PreparedFrameTemplateRenderer {
	render: (content: string) => string;
	renderTemplate: (template: FrameTemplate) => Frame;
}

export const prepareRenderer = (
	render: FrameTemplateRenderer,
	configMap: ConfigMap,
): PreparedFrameTemplateRenderer => {
	return {
		render: (content: string) => render(content, configMap),
		renderTemplate: (template: FrameTemplate) => {
			const frame = createFrame();

			Object.keys(template.files).forEach(
				path => (frame.files[path] = render(template.files[path], configMap)),
			);

			return frame;
		},
	};
};
