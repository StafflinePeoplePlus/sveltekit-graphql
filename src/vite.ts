import type { Plugin } from 'vite';
import watchAndRun from 'vite-plugin-watch-and-run';
import { relative } from 'path';
import { codegen } from './codegen.js';
import houdini from 'houdini/vite';

let hadErrors = false;
export default function (): Plugin[] {
	return [
		{
			name: 'sveltekit-graphql',
			enforce: 'pre',
			async buildStart() {
				try {
					const start = performance.now();
					const changed = await codegen({ base: process.cwd() });
					const taken = performance.now() - start;
					if (changed) {
						console.log(
							`\x1b[32m⚡️ SvelteKit GraphQL - Code generated in ${taken.toFixed(0)}ms \x1b[m`,
						);
					}
				} catch (e) {
					console.error(`\x1b[31m⚡️ SvelteKit GraphQL - Failed to generate code: \x1b[m`);
					console.error(e);
					process.exit(1);
				}
			},
		},
		watchAndRun([
			{
				name: 'sveltekit-graphql',
				logs: ['streamError'],
				async watchFile(filepath) {
					const relativePath = relative(process.cwd(), filepath);
					return (
						(relativePath.startsWith('src/graphql') && relativePath.endsWith('.graphql')) ||
						relativePath.endsWith('houdini.config.js')
					);
				},
				async run() {
					try {
						const start = performance.now();
						const changed = await codegen({ base: process.cwd() });
						const taken = performance.now() - start;
						if (changed || hadErrors) {
							console.log(
								`\x1b[32m⚡️ SvelteKit GraphQL - Code regenerated in ${taken.toFixed(0)}ms \x1b[m`,
							);
						}
						hadErrors = false;
					} catch (e) {
						hadErrors = true;
						console.error(`\x1b[31m⚡️ SvelteKit GraphQL - Failed to regenerate code: \x1b[m`);
						console.error(e);
					}
				},
				watchKind: ['add', 'change', 'unlink'],
			},
		]),
		...houdini(),
	];
}
