import { expect, test } from '@oclif/test';
import * as path from 'path';

describe('generate', () => {
	test
		.stdout()
		.command(['generate', '-c'])
		.exit(2)
		.it('exists with an error code 2 with missing required flags');

	test
		.stdout()
		.command([
			'generate',
			'-c',
			path.normalize(path.join(__dirname, '../environment.yml')),
		])
		.timeout(500000)
		.it('runs OK with good values', ctx => {
			expect(ctx.stdout).to.contain('Generated artifacts');
		});
});
