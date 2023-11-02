import { createYoga, createSchema as createSchemaYoga } from 'graphql-yoga';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createSchema(modules: { typeDefs: any; resolvers: any }[]) {
	const typeDefsMerged = mergeTypeDefs(modules.map((m) => m.typeDefs));
	const resolversMerged = mergeResolvers(modules.map((m) => m.resolvers));
	return createSchemaYoga({ typeDefs: typeDefsMerged, resolvers: resolversMerged });
}

export type ServerOptions = {
	endpoint?: string;
};

export function createServer(
	schema: ReturnType<typeof createSchema>,
	{ endpoint = '/graphql' }: ServerOptions = {},
) {
	return createYoga({
		schema,
		graphqlEndpoint: endpoint,
		fetchAPI: { Response: globalThis.Response },
	});
}
