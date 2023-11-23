---
'sveltekit-graphql': patch
---

Order sveltekitGql vite plugin above sveltekit

Previously we were adding our vite plugin after sveltekit. This was incorrect because the houdini
vite plugin (which is added internally) needs to come after the sveltekit plugin.
