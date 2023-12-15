# sveltekit-graphql

## 0.4.2

### Patch Changes

- 58962e6: allow vite 5 as a peer dependency

## 0.4.1

### Patch Changes

- f75f0c1: Order sveltekitGql vite plugin above sveltekit

  Previously we were adding our vite plugin after sveltekit. This was incorrect because the houdini
  vite plugin (which is added internally) needs to come after the sveltekit plugin.

## 0.4.0

### Minor Changes

- 548f57b: Add option to pass context to the Yoga GraphQL server

  This just passes the context straight to the createYoga function. It can either be an object or a
  function that takes the request context and returns an object.

  ```js
  const server = createServer(schema, {
    context: { hello: "world" },
  });
  ```

- dd3eac9: Write combined server schema into .sveltekit-graphql/schema.graphql and point houdini to this file.

  The include path for houdini has also been updated to prevent inclusion of _any_ .graphql files by
  default.

- dd3eac9: Allow configuring additional server schema files.

  By default the schema glob for the graphql server is defined as `src/graphql/**/*.graphql`. This can
  now be expanded by adding the `additionalServerSchema` property to your `houdini.config.js` file.

  E.g.

  ```js
  import { createHoudiniConfig } from "sveltekit-graphql/config";

  const config = createHoudiniConfig({
    additionalServerSchema: [
      "./node_modules/my-cool-graphql-module/schema.graphql",
    ],
  });

  export default config;
  ```

- dd3eac9: Add out of the box support for the `@oneOf` directive

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
  import { createHoudiniConfig } from "sveltekit-graphql/config";

  const config = createHoudiniConfig({
    scalars: {
      Void: {
        type: "void",
        serverType: "void",
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
