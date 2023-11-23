#!/usr/bin/env node

import { program } from 'commander';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { execSync } from 'node:child_process';
import ts from 'typescript';
import { codegen } from './codegen.js';
import { codegen as houdiniCodegen } from './houdini.js';

program
	.command('init')
	.description(
		'Generate/modify files in an existing sveltekit project to add sveltekit-graphql integration',
	)
	.action(async () => {
		const base = process.cwd();

		await addIgnores(base, '.gitignore');
		await addIgnores(base, '.eslintignore');
		await addIgnores(base, '.prettierignore');

		if (
			await modifyFile(base, 'svelte.config.js', (source: string) => {
				if (source == '') {
					throw new Error('svelte.config.js not found');
				}
				if (source.includes('$graphql')) {
					return source;
				}

				if (source.includes('alias:')) {
					return source.replace(
						/\balias:\s*{/,
						'alias: {\n$graphql: "./src/graphql", $houdini: "./$houdini"',
					);
				} else {
					return source.replace(
						/\badapter:/,
						'alias: {\n$graphql: "./src/graphql", $houdini: "./$houdini" },\nadapter:',
					);
				}
			})
		) {
			console.log('✅ aliases added to `/svelte.config.js`');
		} else {
			console.log('✅ `/svelte.config.js` already modified');
		}

		await addFile({
			base,
			path: 'src/routes/graphql/+server.ts',
			added: 'added /graphql server route',
			exists: '/graphql route already exists',
			contents:
				"export { default as GET, default as POST, default as OPTIONS } from '$graphql/server';\n",
		});
		await addFile({
			base,
			path: 'src/graphql/client.ts',
			added: 'added houdini client',
			exists: 'houdini client already exists',
			contents: `import { HoudiniClient } from '$houdini';

export default new HoudiniClient({ url: '/graphql' });
`,
		});

		await addFile({
			base,
			path: 'houdini.config.js',
			added: 'added houdini config',
			exists: 'houdini config already exists',
			contents: `import { createHoudiniConfig } from 'sveltekit-graphql/config';

			const config = createHoudiniConfig({
				scalars: {
					// You can define custom scalars here
				},
			});
			
			export default config;
`,
		});

		await addFile({
			base,
			path: '.graphqlrc.yaml',
			added: 'added graphql config',
			exists: 'graphql config already exists',
			contents: `projects:
  default:
    schema:
      - ./src/graphql/**/*.graphql
      - ./$houdini/graphql/schema.graphql
    documents:
      - './src/**/*.gql'
      - './src/**/*.svelte'
      - './src/**/*.ts'
      - ./$houdini/graphql/documents.gql
`,
		});

		await addFile({
			base,
			path: 'src/graphql/server.ts',
			added: 'added src/graphql/server.ts',
			exists: 'src/graphql/server.ts already exists',
			contents: `import { createSchema, createServer } from "sveltekit-graphql";
import helloModule from './hello';

const schema = createSchema([helloModule]);
const server = createServer(schema);

export default server;
`,
		});
		if (await createModule(base, 'hello')) {
			console.log('✅ created hello module');
		} else {
			console.log('✅ hello module already exists');
		}

		if (
			await modifyFile(base, 'vite.config.ts', (source: string) => {
				if (source == '') {
					throw new Error('vite.config.ts not found');
				}
				if (source.includes('sveltekit-graphql/vite')) {
					return source;
				}

				return source
					.replace(
						"'@sveltejs/kit/vite';",
						"'@sveltejs/kit/vite';\nimport sveltekitGql from 'sveltekit-graphql/vite';",
					)
					.replace(/sveltekit\(\),?/, 'sveltekitGql(), sveltekit(),');
			})
		) {
			console.log('✅ installed vite plugin');
		} else {
			console.log('✅ vite plugin already installed');
		}

		// Sync to ensure tsconfig.json is generated
		execSync('npx svelte-kit sync');
		console.log('✅ svelte-kit sync');

		const { config: svelteTsConfig } = ts.parseConfigFileTextToJson(
			'tsconfig.json',
			await readFile(resolve(base, '.svelte-kit/tsconfig.json'), { encoding: 'utf-8' }),
		);
		const { config: mainTsConfig } = ts.parseConfigFileTextToJson(
			'tsconfig.json',
			await readFile(resolve(base, 'tsconfig.json'), { encoding: 'utf-8' }),
		);
		if (!mainTsConfig.compilerOptions.rootDirs?.includes('./.sveltekit-graphql/types')) {
			mainTsConfig.compilerOptions.rootDirs ??= [];
			mainTsConfig.compilerOptions.rootDirs.push(
				...svelteTsConfig.compilerOptions.rootDirs.map((dir: string) => {
					const resolved = relative(base, resolve(base, '.svelte-kit', dir));
					if (resolved == '') {
						return '.';
					}
					return './' + resolved;
				}),
			);
			mainTsConfig.compilerOptions.rootDirs.push('./.sveltekit-graphql/types');
			mainTsConfig.compilerOptions.rootDirs.push('./$houdini/types');
			await writeFile(resolve(base, 'tsconfig.json'), JSON.stringify(mainTsConfig, null, 4), {
				encoding: 'utf-8',
			});
			console.log('✅ added root dirs to tsconfig.json');
		} else {
			console.log('✅ tsconfig.json root dirs already added');
		}

		await codegen({ base });
		await houdiniCodegen();
		console.log('✅ first codegen run');

		execSync('npm run format');
		console.log('✅ formatted code');
	});

program
	.command('module <name>')
	.description('Generate a new module')
	.action(async (name) => {
		const base = process.cwd();

		if (await createModule(base, name)) {
			console.log('✅ created module');
		} else {
			console.log('❌ module already exists');
			return;
		}

		await patchModuleIntoServer(base, name);
		console.log('✅ imported module into src/graphql/server.ts');

		await codegen({ base });
		console.log('✅ codegen run');

		execSync('npm run format');
		console.log('✅ formatted code');
	});

program
	.command('generate')
	.description('Manually run codegen')
	.action(async () => {
		const base = process.cwd();
		await codegen({ base });
		console.log('✅ codegen run');
		await houdiniCodegen();
		console.log('✅ houdini generate run');
	});

program.parse();

async function modifyFile(path: string, name: string, modify: (source: string) => string) {
	const filepath = resolve(path, name);
	await mkdir(path, { recursive: true });
	let contents = '';
	try {
		contents = await readFile(filepath, { encoding: 'utf-8' });
	} catch (err) {
		if ((err as { code: string }).code !== 'ENOENT') {
			throw err;
		}
	}

	const modified = modify(contents);
	if (modified !== contents) {
		await writeFile(filepath, modified, { encoding: 'utf-8' });
		return true;
	}
	return false;
}

async function exists(path: string) {
	try {
		await stat(path);
		return true;
	} catch (err) {
		if ((err as { code: string }).code !== 'ENOENT') {
			throw err;
		}
		return false;
	}
}

const moduleTemplate = {
	'index.ts': `import typeDefs from './schema.graphql?raw';
import { resolvers } from './resolvers';

export default { typeDefs, resolvers };
`,
	'resolvers.ts': `import type { WithIndex } from '../$types';
import type { Resolvers } from './$types';

export const resolvers: WithIndex<Resolvers> = {
	Query: {
		hello() {
			return 'Hello SvelteKit!';
		},
	},
};
`,
	'schema.graphql': `type Query {
	hello: String!
}
`,
};

async function createModule(base: string, name: string) {
	const moduleDir = resolve(base, 'src/graphql', name);
	if (await exists(moduleDir)) {
		return false;
	} else {
		await mkdir(moduleDir, { recursive: true });
		for (const [file, contents] of Object.entries(moduleTemplate)) {
			await writeFile(resolve(moduleDir, file), contents, { encoding: 'utf-8' });
		}
		return true;
	}
}

function patchModuleIntoServer(base: string, name: string) {
	return modifyFile(base, 'src/graphql/server.ts', (source: string) => {
		if (!source) {
			throw new Error('src/graphql/server.ts not found');
		}

		return source
			.replace(/Module from.+?;/s, (matched) => {
				return matched + `\nimport ${name}Module from './${name}';`;
			})
			.replace(/createSchema\(\[(.+?)\]\)/s, (_, modules) => {
				return `createSchema([${modules}, ${name}Module])`;
			});
	});
}

async function addFile(opts: {
	base: string;
	path: string;
	contents: string;
	added: string;
	exists: string;
}) {
	const filepath = resolve(opts.base, opts.path);
	await mkdir(dirname(filepath), { recursive: true });
	if (
		await modifyFile(opts.base, opts.path, (source: string) => {
			if (source != '') {
				return source;
			}

			return opts.contents;
		})
	) {
		console.log('✅', opts.added);
	} else {
		console.log('✅', opts.exists);
	}
}

async function addIgnores(base: string, file: string) {
	if (
		await modifyFile(base, file, (source: string) => {
			if (source.includes('/.sveltekit-graphql')) {
				return source;
			}
			if (source.length !== 0 && !source.endsWith('\n')) {
				source += '\n';
			}
			source += '/.sveltekit-graphql\n/$houdini\n';
			return source;
		})
	) {
		console.log(`✅ ${file} updated`);
	} else {
		console.log(`✅ ${file} already up to date`);
	}
}
