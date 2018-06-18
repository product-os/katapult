import { base64decode } from '../filters';

export async function getEcPrivateKey(
	keypair: string | Promise<string>,
): Promise<string> {
	return JSON.parse(await base64decode(await keypair)).privateKey;
}
