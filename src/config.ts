import type { ConfigFile } from 'houdini';

export function createHoudiniConfig(config: ConfigFile) {
	return {
		schemaPath: '.sveltekit-graphql/schema.graphql',
		include: 'src/**/*.{svelte,gql,ts,js}',
		plugins: {
			'houdini-svelte': {
				client: './src/graphql/client.ts',
			},
			...(config.plugins ?? {}),
		},
		...config,
	} as ConfigFile;
}
