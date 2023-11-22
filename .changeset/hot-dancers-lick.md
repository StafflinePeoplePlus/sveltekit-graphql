---
'sveltekit-graphql': minor
---

Add option to pass context to the Yoga GraphQL server

This just passes the context straight to the createYoga function. It can either be an object or a
function that takes the request context and returns an object.

```js
const server = createServer(schema, {
	context: { hello: 'world' },
});
```
