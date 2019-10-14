import * as frameTemplate from '../../src/lib/controllers/frame-template';
import * as fs from 'mz/fs';
import * as path from 'path';
import { expect } from 'chai';
import { getTestDir } from '../files';

describe('frame-template', () => {
	it('should create a FrameTemplate from a directory of files', async () => {
		// create a FrameTemplate from a directory of files...
		const frameTemplateDir = await getTestDir(
			'test-product-staging/product/deploy/docker-compose/templates_check',
		);
		const ft = await frameTemplate.fromDirectory(frameTemplateDir);

		// check some basics...
		expect(Object.keys(ft.files)).to.have.lengthOf(1);
		expect(ft.files['docker-compose.yml']).is.not.undefined;

		// get the content of a file...
		const dockerCompose = await fs.readFile(
			path.join(frameTemplateDir, 'docker-compose.yml'),
			'utf8',
		);

		// check the FrameTemplate version matches it...
		expect(ft.files['docker-compose.yml']).to.equal(dockerCompose);
	});
});
