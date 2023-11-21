---
'sveltekit-graphql': minor
---

Allow configuring additional server schema files.

By default the schema glob for the graphql server is defined as `src/graphql/**/*.graphql`. This can
now be expanded by adding the `additionalServerSchema` property to your `houdini.config.js` file.

E.g.

```js
import { createHoudiniConfig } from 'sveltekit-graphql/config';

const config = createHoudiniConfig({
	additionalServerSchema: ['./node_modules/my-cool-graphql-module/schema.graphql'],
});

export default config;
```
