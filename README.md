# SvelteKit GraphQL

Opinionated GraphQL server and client setup for SvelteKit applications, utilising [Houdini](https://houdinigraphql.com) and [Yoga](https://the-guild.dev/graphql/yoga-server).

-   🔧 Minimal configuration
-   🎩 Powered by [Houdini](https://houdinigraphql.com) & [Yoga](https://the-guild.dev/graphql/yoga-server)
-   ⚡ Quick & easy setup

## Introduction

SvelteKit GraphQL consists of three parts.

### CLI

The CLI is used on initial setup to quickly scaffold out a skeleton graphql server in an existing
SvelteKit app. It can also be used to add new modules later down the line.

### Vite Plugin

The vite plugin adds hooks to vite to run codegen on build, and on the dev server as you change your
shemas. It also automatically adds in the houdini vite plugin.

### Runtime Package

To avoid needing to manually install and configure many of the dependencies you typically need when
working with GraphQL, SvelteKit GraphQL provides a package wrapping and/or exporting these as
needed.

## Getting Started

The following assumes you already have a SvelteKit app set up and working, and that you are in the
root directory of your app in your terminal. If you don't have a SvelteKit app yet, follow the
official SvelteKit documentaion to create one and then come back here once that is confirmed
working.

Install sveltekit-graphql

```bash
npm i -D sveltekit-graphql
```

Run the script to initialise your repo. It is recommended to commit any pending changes
before running this.

```bash
npx sveltekit-graphql init
```

Assuming everything worked as intended, you should now have a working GraphQL set up in your
SvelteKit app!

Run the dev server to check if everything is working:

```bash
npm run dev
```

Going to http://localhost:5173/graphql, you should see the Yoga GraphiQL interface.

### Next Steps

You can now start building out your GraphQL queries and mutations. The CLI has set you up with a
module style setup in 'src/graphql/' allowing you to split up your schema into separate areas of
concern. You are free to expand on this or simply stay with one module. Check out the
[Yoga documentation](https://the-guild.dev/graphql/yoga-server) to learn more.

Houdini is set up and ready for you to start making client queries. Check out the [houdini
documentation](https://houdinigraphql.com/intro) to learn more.
