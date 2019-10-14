import * as mustache from 'mustache';
import { TemplateGeneratorRenderer } from './index';
import { Keyframe } from '../../keyframe/index';

export const Renderer: TemplateGeneratorRenderer = (
	content: string,
	keyframe: Keyframe,
) => {
	return mustache.render(content, keyframe, null, ['<<%', '%>>']);
};
