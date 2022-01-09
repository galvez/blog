---
date: February 22, 2020
---

# The Ultimate Nuxt API Setup

Since Evan You has been [actively working on Vue 3's revamped SSR support](https://github.com/vuejs/vue-next/pulls?utf8=%E2%9C%93&q=is%3Apr+is%3Aclosed+ssr), and [**Nuxt just got 2 million in funding**](https://twitter.com/Atinux/status/1230566281020968960), I must warn you that what follows can hardly be truly called **_ultimate_**. 

Surely there's plenty cool stuff coming our way after Vue 3 and Nuxt 3 have seen the light of day.

Still, I have to say, I can finally breathe a sigh of relief for my current and near future Nuxt API needs.

I've revised my API setup for Nuxt apps maybe a dozen of times. I've integrated API methods into Vuex, I have tried [autogenerating API methods from YAML](https://github.com/galvez/yamlful) (which worked well in an app or two), but most of the time I ended up manually maintaining API clients. 

In JavaScript, there's this inevitable urge to rethink things, just because the language and associated web APIs are so flexible. We default to using the best validated ideas available, packaged in the form of frameworks and framework ecosystems, like Nuxt. But there's always this lingering feeling that I'm missing something.

_What should I try differently this time?_

I have always advocated using Nuxt's own [connect](https://github.com/senchalabs/connect)-based server for deploying APIs. My rationale for that was that, for one thing, you could still do upstream scaling of processes responsible for API endpoints separately if you want, and stacking things as `serverMiddleware` under `nuxt.config.js` is maintainable *_enough_* for _most_ projects.

> You never know what is enough unless 
> you know what is more than enough. -- William Blake

Well, that pretty much summarizes **_refactoring_**.

I look at the code I wrote in the past few years and see them as a sine wave of added and reduced complexity. It's tricky to find the right balance, but perhaps a good measurement is to determine if adding complexity eliminates more problems than it introduces. For this you have to be **skeptical of your own code**, and eliminate all previous assumptions first. _Remove the framework from of your mind_.

After engaging in the massive challenge of migrating a large API **from PHP to Node** while **integrating Nuxt and Fastify**, it was time to rethink things.

## Is Time To Drop Nuxt Server?

I think [`nuxt start`](https://nuxtjs.org/guide/commands/) is perhaps Nuxt's most controversial feature, *_inside my head at least_*. On one side, you have the convenience of not having to worry about choosing a full blown server, _just use Nuxt_ and you're good.

And it does get the job done for most kinds of projects. That's why we started [nuxt/metal](https://github.com/nuxt/metal) — having a lean connect-like server will be a _Good Thing_.

On the other side, things can get really messy and hard to maintain if your Nuxt app amounts to any level of considerable complexity. 

As a way of exploring some ideas, mainly thinking outside the Nuxt `serverMiddleware` paradigm, I decided to try [Fastify](http://fastify.io/) to host a **unified codebase** containing **both low-level, backend API routes** and **also serve the Nuxt application**.

## Nuxt on Fastify

Not that I haven't done this before, _mind you_, I did initially use Nuxt programmaticaly with [Koa.js](https://koajs.com/), but Koa.js didn't offer many benefits over Nuxt's `serverMiddleware` aside from better async support.

With **Fastify**, well, **_there are benefits_**. And I'm not only talking about its meticulous attention to performance. I'm really just talking about its plugin system, hooks, decorators, built-in validators and serializers. It feels complete, yet minimalist in essence. It gives me a lot of liberty to organize and load code whichever manner I see fit.

[Fastify's plugin system][fastify-plugins] feels similar to Nuxt's module system in functionality. You can use it to initialize external connections, register routes based on settings and well, even generate code that runs before boot time, like Nuxt does, and like I have done for generating client methods.

[fastify-plugins]: https://github.com/fastify/fastify/blob/master/docs/Plugins-Guide.md

## API handlers and client methods

It always annoyed me that I had to write API client methods matching API handlers in the same repository, that is, this always felt like something that should be automated. Things like [`swagger-codegen`](https://github.com/swagger-api/swagger-codegen) are awesome but I wanted a simpler, more Nuxt-focused solution.

So I started by writing a custom API route loader for Fastify, that would make it easier to retrieve metadata about available methods. The result was [`fastify-esm-loader`](https://github.com/galvez/fastify-esm-loader). 

From the README:

> `fastify-esm-loader` will recursively look for 
> index.js files use them to register routes, at any depth.
 
```js
export default function ({ fastify, self, env }) {
  fastify.get('/users/all', self.listUsers)
  fastify.get('/users/:id', self.getUser)
  fastify.post('/users/', self.createUser)
}
```

In the snippet above, which needs to be located at `<baseDir>/<service>/index.js`,
we have access to all files in that same directory, which are preloaded and made
available at `self`. This is just a convenience for clean, contextual mapping of
route handlers to their API endpoints.

The current version of fastify-esm-loader does **require** you to structure
API route handlers in full directories with an `index.js` file. That is to say,
you must have `<service>/index.js` and one file per handler in the same directory. 

Support for a single file (`<service>.js`) registering multiple handlers without 
relying on external files is planned.

## The boilerplate

[Get it here](http://github.com/galvez/fastify-nuxt-api/). The rundown:

- [`server/main.js`](https://github.com/galvez/fastify-nuxt-api/blob/master/server/main.js): the Fastify entry point
- [`server/nuxt.js`](https://github.com/galvez/fastify-nuxt-api/blob/master/server/nuxt.js): Nuxt plugin (sets up route and build)
- [`server/loader.js`](https://github.com/galvez/fastify-nuxt-api/blob/master/server/loader.js): wrapper to **fastify-esm-loader** for codegen
- [`server/gen.js`](https://github.com/galvez/fastify-nuxt-api/blob/master/server/gen.js): client boilerplate codegen functions
- [`server/routes/<service>`](https://github.com/galvez/fastify-nuxt-api/tree/master/server/routes): API route handlers
- [`server/routes/index.js`](https://github.com/galvez/fastify-nuxt-api/blob/master/server/routes/index.js): exportables automatically injected
- [`client/`](https://github.com/galvez/fastify-nuxt-api/tree/master/client): the Nuxt application
- [`index.js`](https://github.com/galvez/fastify-nuxt-api/blob/master/index.js): just an esm wrapper for booting Fastify

## The Nuxt plugin

Nuxt's rendering middleware expects vanilla `IncommingMessage` and `ServerResponse`
objects, which are available in Fastify via `req.raw` and `reply.res`, so [we have](https://github.com/galvez/fastify-nuxt-api/blob/master/server/nuxt.js):

```js
const nuxt = new Nuxt({ dev: process.dev, ...nuxtConfig })
await nuxt.ready()

fastify.get('/*', (req, reply) => {
  nuxt.render(req.raw, reply.res)
})
```

We also need to set up the build process in dev mode:

```js
if (process.dev) {
  process.buildNuxt = () => {
    return new Builder(nuxt).build()
      .catch((buildError) => {
        consola.fatal(buildError)
        process.exit(1)
      })
  }
}
```

We don't immediately build Nuxt because we want to do it after the loader plugin
has had a chance to add an autogenerated file to the build containing all API
client methods. This way we can call `process.buildNuxt()` at the appropriate time.

## The almighty API loader

In `loader.js`, there's a wrapper to fastify-esm-loader that will collect 
data about routes being registered, and use that data to **_codegen_** associated 
API client methods both for SSR and client-side consumers.

We start by collecting said data with `onRoute`:

```js
const api = {}
const handlers = {}
fastify.addHook('onRoute', (route) => {
  const name = route.handler[methodPathSymbol]
  if (name) {
    const routeData = [route.method.toString(), route.url]
    setPath(api, name, routeData)
    setPath(handlers, name, route.handler)
  }
})
await FastifyESMLoader(fastify, options, done)
await fastify.ready()
```

Now armed with `api` and `handlers`, we can use the functions in [`gen.js`](https://github.com/galvez/fastify-nuxt-api/blob/master/server/gen.js) to
automatically build these client boilerplates:

```js
const clientMethods = generateClientAPIMethods(api)
const apiClientPath = resolve(__dirname, join('..', 'client', 'api.js'))
await writeFile(apiClientPath, clientMethods)

const serverMethods = generateServerAPIMethods(api)
const apiServerPath = resolve(__dirname, join('api.js'))
await writeFile(apiServerPath, serverMethods)
```

And once built, in the very same code block:

```js
const getServerAPI = await import(apiServerPath).then(m => m.default)
```

Generate code and live import it! The next part is offering an [axios](https://github.com/axios/axios)-like interface to Fastify route handlers. I managed to get it to an usable state with `translateRequest` and `translateRequestWithPayload`, also available in `gen.js`. For SSR, we make that object available directly in `process.$api`:

```js
process.$api = getServerAPI({
  handlers,
  translateRequest,
  translateRequestWithPayload
})
```

And finally, trigger the Nuxt build:

```js
if (process.buildNuxt) {
  await process.buildNuxt()
}
```

## Wait, _what_?

So you're probably wondering _what the fork_ `translateRequest()` and its taller brother do. They act like adapters to Fastify route handlers, as if we were mocking live HTTP requests to them, _but not really_. Here's a simplified snippet:

```js
export function translateRequest (handler, params, url, options = {}) {
  return new Promise((resolve, reject) => {
    handler(
      {
        url,
        params,
        query: options.params,
        headers: options.headers,
      },
      {
        send: (data) => {
          resolve({ data })
        },
      },
    )
  })
}
```

Of course [the real deal has a bit more juice to it](https://github.com/galvez/fastify-nuxt-api/blob/master/server/gen.js).

Why go through all this trouble, you may ask. So we **don't have to make live HTTP requests for API calls during SSR**!

We're also almost done — let's get all this to Nuxt.

## Making $api available in Nuxt

First we need to [use a plugin](https://github.com/galvez/fastify-nuxt-api/blob/master/client/plugins/api.js) to inject `$api` everywhere. If the request is running entirely on the server (SSR), we assign `process.$api` directly to `ctx.$api`, which will provide working methods that **directly run Fastify route handlers**.

If the app's already loaded on the client though, we use the function (here I just import it as `getClientAPI`) that was automatically generated and placed in [`client/api.js`](https://github.com/galvez/fastify-nuxt-api/blob/master/client/api.js):

```js
import getClientAPI from '../api'

export default (ctx, inject) => {
  if (process.server) {
    ctx.$api = process.$api
  } else {
    ctx.$api = getClientAPI(ctx.$axios)
  }
  inject('api', ctx.$api)
}
```

Assuming we have this in [`server/routes/hello/msg.js`](https://github.com/galvez/fastify-nuxt-api/blob/master/server/routes/hello/msg.js):

```js
export default (req, reply) => {
  reply.send({ message: 'Hello from API' })
}
```

We can now do an asyncData like this in our Nuxt pages:

```html
<template>
  <main>
    <h1>{{ message }}</h1>
  </main>
</template>

<script>
export default {
  async asyncData ({ $api }) {
    const { data } = await $api.hello.msg()
    return data
  }
}
</script>
```

So `$api.hello.msg`(), we didn't have to write. It was already there, automatically generated from the contents of the `server/routes` directory. _A Nuxt Eye to the Fastify Guy_!

## Bonus: dependency injection

You'll notice this boilerplate comes with an example on how to do dependency injection into route handlers. If **fastify-esm-loader** detects the default function exported by `<service>/<handler>.js` has one argument only, it will use it to pass injections (from exports in `routes/index.js`) before returning the final handler function. That means you can do things like:

```js
export default ({ injection }) => (req, reply) => {
  reply.send({ injection })
}
```

## Conclusion

I'm someone with unpopular opinions.

I like [boring techonology](http://boringtechnology.club/). I think TypeScript and GraphQL **go the opposite direction of minimalism**. I understand their value and usefulness, but I'd rather see TypeScript code in very select, hand-picked, foundational libraries rather than in everyday code. Vue 3's code is really **_inspiring_**, but I'd still not use TypeScript in my everyday code.

Not that this has anything to do with this article, I just like to vent about TypeScript 😈

API automation **_does_** relate to GraphQL and, as complex as this Fastify and Nuxt API boilerplate may seem, the sum of all of its code still stays far below that of any GraphQL-based solution, with no HTTP requests happening in SSR. 

As far as speed goes, while serving Nuxt via Fastify yields roughly the same performance as serving Nuxt from its built-in, connect-based server, **avoiding HTTP requests for SSR API calls can really make a difference in high SSR load**. With some work you can probably adapt Pim's awesome [nuxt-lambda](https://github.com/pimlie/nuxt-lambda) to serve Nuxt requests from Fastify.

And most importantly, being able to organize code using Fastify's plugins seems to make for an easier, more maintainable setup than a huge stack of `serverMiddleware`.
