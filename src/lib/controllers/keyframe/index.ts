import * as fs from 'mz/fs';
import { safeLoad } from 'js-yaml';
import { Dictionary } from 'lodash';
import { error } from 'util';

export type Keyframe = Dictionary<any>;

export const loadKeyframe = async (keyframeUri: string): Promise<Keyframe> => {
	const yaml = await fs.readFile(keyframeUri, 'utf8');
	return safeLoad(yaml) as Keyframe;
};
