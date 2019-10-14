import { FrameTemplate } from '../';
import { filesystemExportAdapter } from './filesystem';

export interface FrameTemplateExportAdapter {
	export: (frame: FrameTemplate) => Promise<void>;
}

export const exportAdapters = {
	filesystem: filesystemExportAdapter,
};
