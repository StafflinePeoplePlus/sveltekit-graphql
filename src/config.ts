import type { ConfigFile } from 'houdini';

export function createHoudiniConfig(config: ConfigFile) {
	return {
		schemaPath: 'src/graphql/**/*.graphql',
		plugins: {
			'houdini-svelte': {
				client: './src/graphql/client.ts',
			},
			...(config.plugins ?? {}),
		},
		...config,
	} as ConfigFile;
}
