import * as _ from 'lodash';
import { TemplateGenerator } from '..';
import { Keyframe } from '../../keyframe/index';
import { FrameTemplate, createFrameTemplate } from '../../frame-template/index';

export type TemplateGeneratorRenderer = (
	content: string,
	keyframe: Keyframe,
) => string;

export interface PreparedFrameGeneratorRenderer {
	render: (content: string) => string;
	renderTemplate: (template: TemplateGenerator) => FrameTemplate;
}

export const prepareRenderer = (
	render: TemplateGeneratorRenderer,
	keyframe: Keyframe,
): PreparedFrameGeneratorRenderer => {
	return {
		render: (content: string) => render(content, keyframe),
		renderTemplate: (template: TemplateGenerator) => {
			const frameTemplate = createFrameTemplate();

			frameTemplate.files = _.mapValues(template.files, file =>
				render(file, keyframe),
			);

			return frameTemplate;
		},
	};
};
