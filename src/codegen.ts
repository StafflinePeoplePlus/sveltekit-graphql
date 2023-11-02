import { codegen as gqlCodegen } from '@graphql-codegen/core';
import { loadSchema } from '@graphql-tools/load';
import { resolve, dirname } from 'path';
import * as typescriptPlugin from '@graphql-codegen/typescript';
import * as typescriptResolversPlugin from '@graphql-codegen/typescript-resolvers';
import modulesPreset from '@graphql-codegen/graphql-modules-preset';
import * as addPlugin from '@graphql-codegen/add';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { parse, printSchema } from 'graphql';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';

export async function codegen({ base }: { base: string }) {
	const typesRootDir = resolve(base, '.sveltekit-graphql/types');

	const schema = await loadSchema(resolve(base, 'src/graphql/**/*.graphql'), {
		loaders: [new GraphQLFileLoader()],
		includeSources: true,
		sort: true,
	});

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
		schema: parse(printSchema(schema)),
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
			scalars: { DateTime: 'string', Void: 'void' },
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
