import * as frameTemplate from '../../src/lib/controllers/frame/frame-template';
import * as fs from 'mz/fs';
import * as path from 'path';
import { expect } from 'chai';

describe('FrameTemplate', () => {
	const frameTemplateDir = path.join(__dirname, 'frame-template');

	it('should create a FrameTemplate from a directory of files', async () => {
		// create a FrameTemplate from a directory of files...
		const ft = await frameTemplate.fromDirectory(frameTemplateDir);

		// check some basics...
		expect(Object.keys(ft.files)).length(2);
		expect(ft.files['docker-compose.yml']).is.not.undefined;
		expect(ft.files['certs/balena-root-ca.pem']).is.not.undefined;

		// get the content of a file...
		const dockerCompose = (await fs.readFile(
			path.join(frameTemplateDir, 'docker-compose.yml'),
		)).toString();

		// check the FrameTemplate version matches it...
		expect(ft.files['docker-compose.yml']).to.equal(dockerCompose);
	});
});
