import { codegen as gqlCodegen } from '@graphql-codegen/core';
import { loadSchema } from '@graphql-tools/load';
import { resolve, dirname } from 'path';
import * as typescriptPlugin from '@graphql-codegen/typescript';
import * as typescriptResolversPlugin from '@graphql-codegen/typescript-resolvers';
import modulesPreset from '@graphql-codegen/graphql-modules-preset';
import * as addPlugin from '@graphql-codegen/add';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { parse } from 'graphql';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { printSchemaWithDirectives } from '@graphql-tools/utils';
import { ONE_OF_DIRECTIVE_SDL } from '@envelop/extended-validation';

export async function codegen({ base }: { base: string }) {
	const sveltekitGraphqlDir = resolve(base, '.sveltekit-graphql');
	const typesRootDir = resolve(sveltekitGraphqlDir, 'types');
	const { default: houdiniConfig } = await import(resolve(base, 'houdini.config.js'));

	const schemaSources = [ONE_OF_DIRECTIVE_SDL, resolve(base, 'src/graphql/**/*.graphql')];
	if (houdiniConfig.additionalServerSchema) {
		schemaSources.push(
			...houdiniConfig.additionalServerSchema.map((path: string) => resolve(base, path)),
		);
	}
	const schema = await loadSchema(schemaSources, {
		loaders: [new GraphQLFileLoader()],
		includeSources: true,
		sort: true,
		cwd: base,
	});
	const schemaString = printSchemaWithDirectives(schema);

	await mkdir(sveltekitGraphqlDir, { recursive: true });
	await writeFile(resolve(sveltekitGraphqlDir, 'schema.graphql'), schemaString, {
		encoding: 'utf8',
	});

	const scalars: Record<string, string> = {};
	if (houdiniConfig?.scalars) {
		for (const [name, scalar] of Object.entries(houdiniConfig.scalars)) {
			scalars[name] =
				typeof scalar === 'object' && scalar !== null && 'serverType' in scalar
					? (scalar.serverType as string)
					: 'string';
		}
	}

	const configs = await modulesPreset.buildGeneratesSection({
		plugins: [
			{
				add: {
					content: `/* eslint-disable */\nimport type { RequestEvent } from '@sveltejs/kit';`,
				},
			},
			{ typescript: {} },
			{ typescriptResolvers: {} },
		],
		pluginMap: {
			add: addPlugin,
			typescript: typescriptPlugin,
			typescriptResolvers: typescriptResolversPlugin,
		},
		schema: parse(schemaString),
		schemaAst: schema,
		presetConfig: {
			baseTypesPath: '$types.ts',
			importBaseTypesFrom: '../$types',
			cwd: typesRootDir,
			filename: '$types.ts',
			encapsulateModuleTypes: 'none',
			useGraphQLModules: false,
		},
		baseOutputDir: resolve(base, 'src/graphql/'),
		documents: [],
		config: {
			useTypeImports: true,
			contextType: 'RequestEvent',
			resolversNonOptionalTypename: true,
			useIndexSignature: true,
			strictScalars: true,
			scalars,
		},
	});
	const results = await Promise.all(
		configs.map(async (config) => {
			return { file: config.filename, content: await gqlCodegen(config) };
		}),
	);

	let updated = false;
	await Promise.all(
		results.map(async ({ file, content }) => {
			const filepath = file.replace(base, typesRootDir);
			await mkdir(dirname(filepath), { recursive: true });
			let existing = '';
			try {
				existing = await readFile(filepath, { encoding: 'utf8' });
			} catch (err) {
				if ((err as { code: string }).code !== 'ENOENT') {
					throw err;
				}
			}
			if (existing !== content) {
				updated = true;
				await writeFile(filepath, content, { encoding: 'utf8' });
			}
		}),
	);
	return updated;
}
