export function escape(text: string): string {
	return text
		.split('\n')
		.join('\\n')
		.split('\r')
		.join('');
}

export async function base64(value: string | Promise<string>): Promise<string> {
	if (typeof value === 'string') {
		return Buffer.from(value).toString('base64');
	} else {
		return Buffer.from(await value).toString('base64');
	}
}

export async function base64decode(
	value: string | Promise<string>,
): Promise<string> {
	if (typeof value === 'string') {
		return Buffer.from(value, 'base64').toString();
	} else {
		return Buffer.from(await value, 'base64').toString();
	}
}
