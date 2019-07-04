import * as mustache from 'mustache';
import { ConfigMap } from '../../config-store/config-store';
import { FrameTemplateRenderer } from './index';

export const mustacheRenderer: FrameTemplateRenderer = (
	content: string,
	configMap: ConfigMap,
) => mustache.render(content, configMap);
