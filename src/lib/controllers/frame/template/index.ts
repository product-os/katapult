import { ConfigMap } from '../../config-store/config-store'

export interface FrameTemplateEngine {
    new (configMap: ConfigMap): FrameTemplateEngine;

    render: (content: string) => string
}
