# sveltekit-graphql

## 0.3.0

### Minor Changes

- 4108ab3: Support for custom scalars in server code generation.

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

## 0.2.0

### Minor Changes

- b5137bb: add utility to create houdini config in project

## 0.1.3

### Patch Changes

- 3fb9e2b: Add generate command to manually run codegen

## 0.1.2

### Patch Changes

- 1c9727f: Fix package exports for sveltekit-graphql/vite

## 0.1.1

### Patch Changes

- 479e319: Also add ignore entries to .eslintignore and .prettierignore
- 479e319: Add typescript to dependencies list as it is used in the CLI

## 0.1.0

### Minor Changes

- 6e71338: Initial release
