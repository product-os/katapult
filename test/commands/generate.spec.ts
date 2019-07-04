/*
Copyright 2019 Balena Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import { expect, test } from '@oclif/test';
import { getTestFile } from '../files';

describe('generate', async () => {
	const environmentsYaml = await getTestFile(
		'deploy-templates/environments.yml',
	);

	test
		.stdout()
		.command(['generate', '-m', 'quiet', '-c'])
		.exit(2)
		.it('should exit with an error code 2 when missing required flags');

	test
		.stdout()
		.command(['generate', '-c', environmentsYaml])
		.timeout(500000)
		.it('runs OK with good values', ctx => {
			expect(ctx.stdout).to.contain('Generated artifacts');
		});
});
