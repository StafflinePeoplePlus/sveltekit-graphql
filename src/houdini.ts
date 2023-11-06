import generate from 'houdini/codegen';
import { getConfig } from 'houdini';

export async function codegen() {
	const config = await getConfig();
	await generate(config);
}
