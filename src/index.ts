import {
	createYoga,
	createSchema as createSchemaYoga,
	type YogaServerOptions,
	type Plugin,
} from 'graphql-yoga';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import {
	OneOfInputObjectsRule,
	useExtendedValidation,
	ONE_OF_DIRECTIVE_SDL,
} from '@envelop/extended-validation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createSchema(modules: { typeDefs: any; resolvers: any }[]) {
	const typeDefsMerged = mergeTypeDefs([ONE_OF_DIRECTIVE_SDL, ...modules.map((m) => m.typeDefs)]);
	const resolversMerged = mergeResolvers(modules.map((m) => m.resolvers));
	return createSchemaYoga({ typeDefs: typeDefsMerged, resolvers: resolversMerged });
}

export type ServerOptions = {
	endpoint?: string;
	context?: YogaServerOptions<{}, {}>['context'];
	plugins?: Plugin[];
};

export function createServer(
	schema: ReturnType<typeof createSchema>,
	{ endpoint = '/graphql', context, plugins = [] }: ServerOptions = {},
) {
	return createYoga({
		schema,
		graphqlEndpoint: endpoint,
		fetchAPI: { Response: globalThis.Response },
		context,
		plugins: [
			useExtendedValidation({
				rules: [OneOfInputObjectsRule],
			}),
			...plugins,
		],
	});
}
