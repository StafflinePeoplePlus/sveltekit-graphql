---
'sveltekit-graphql': minor
---

Support for custom scalars in server code generation.

Custom scalars defined in your houdini.config.js will now be picked up by the server code
generation. By default they will be given the type `string`, but this can be changed by setting the
`serverType` on the scalar config. Note that the `type` field only affects the client side type, as
the server does not use the custom marshal/unmarshal functions defined here and so the types will
likely differ.

For example, here is an example with a custom `Void` type

```js
import { createHoudiniConfig } from 'sveltekit-graphql/config';

const config = createHoudiniConfig({
	scalars: {
		Void: {
			type: 'void',
			serverType: 'void',
			marshal: () => null,
			unmarshal: () => {},
		},
	},
});

export default config;
```
