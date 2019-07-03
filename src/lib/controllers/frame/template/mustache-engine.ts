
import { FrameTemplateEngine } from './index'
import * as mustache from 'mustache';
import { ConfigMap } from '../../config-store/config-store';

export class MustacheEngine implements FrameTemplateEngine {

    private readonly configMap: ConfigMap;

    constructor(configMap: ConfigMap) {
        this.configMap = configMap;
    }

    render(content: string) {
		return mustache.render(content, this.configMap);
	}
}
