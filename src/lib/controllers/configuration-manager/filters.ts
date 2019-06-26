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

/**
 * Escapes newlines
 * @param {string} text
 * @returns {string}
 */
export function escape(text: string): string {
	return text
		.split('\n')
		.join('\\n')
		.split('\r')
		.join('');
}

/**
 * Base64 encodes
 * @param {string | Promise<string>} value
 * @returns {string}
 */
export async function base64(value: string | Promise<string>): Promise<string> {
	return Buffer.from(typeof value === 'string' ? value : await value).toString(
		'base64',
	);
}

/**
 * Base64 decodes
 * @param {string | Promise<string>} value
 * @returns {string}
 */
export async function base64decode(
	value: string | Promise<string>,
): Promise<string> {
	return Buffer.from(
		typeof value === 'string' ? value : await value,
	).toString();
}
