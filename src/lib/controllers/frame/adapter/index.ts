import { Frame } from '../frame';
import { filesystemExportAdapter } from './filesystem';

export interface FrameExportAdapter {
	export: (frame: Frame) => Promise<void>;
}

export const exportAdapters = {
	filesystem: filesystemExportAdapter,
};
