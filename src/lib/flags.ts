import { flags } from '@oclif/command';

export const environmentPath = flags.string({
	description: 'URI of the environment configuration path',
	required: true,
	default: './environment.yml',
	char: 'e',
});

export const outputPath = flags.string({
	description: 'Directory to output the frame to',
	required: true,
	char: 'o',
});

export const target = flags.string({
	description: 'Which target to use.',
	options: ['docker-compose'],
	required: true,
	char: 't',
});
