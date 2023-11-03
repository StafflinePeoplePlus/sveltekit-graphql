import generate from 'houdini/codegen';
// @ts-expect-error Despite having typings, typescript doesn't seem to be able find them correctly.
import { getConfig } from 'houdini';

export const houdiniConfig = {
	schemaPath: 'src/graphql/**/*.graphql',
	plugins: {
		'houdini-svelte': {
			client: './src/graphql/client.ts',
		},
	},
};

export async function codegen() {
	const config = await getConfig(houdiniConfig);
	await generate(config);
}
