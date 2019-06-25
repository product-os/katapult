export function escape(text: string): string {
	return text
		.split('\n')
		.join('\\n')
		.split('\r')
		.join('');
}

export async function base64(value: string | Promise<string>): Promise<string> {
	return Buffer.from(typeof value === 'string' ? value : await value).toString(
		'base64',
	);
}

export async function base64decode(
	value: string | Promise<string>,
): Promise<string> {
	return Buffer.from(
		typeof value === 'string' ? value : await value,
	).toString();
}
