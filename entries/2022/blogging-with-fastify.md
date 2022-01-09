---
date: January 8, 2022
featured: true
---
This blog is statically generated with Fastify, Vite and Vue 3. This is a deep dive into how everything was stitched together.
---

# Blogging with Fastify, Vite and Vue 3

I've always been incredibly envious of [Amos Wenger's blogging setup](https://fasterthanli.me/articles/a-new-website-for-2020), and the amazing write-up covering it. Amos of course wrote ridiculous amounts of Rust code to a) **crawl Markdown entries from the filesystem**, b) **sync them to a SQLite database for maximum efficiency** and c) **compile the entries into HTML** with a number of transformations to patch up things like image paths and syntax highlighting for code blocks.

[Amos' blog](https://fasterthanli.me/) is responsible for over half my Rust education (so far). He goes into _excruciating_ detail explaining multiple iterations to solving a problem and you get to the bottom of his articles feeling like you've just read a book, a really good one. I'd say he wrote [the best resource available today](https://fasterthanli.me/articles/declarative-memory-management) to learn about Rust's borrow checker. But I digress.

This blog is built with [fastify-vite](https://fastify-vite.dev/) <code>v3.0.0-alpha.11</code> and Vue 3. It is **statically generated**, Markdown files are loaded and **made available for hot reload through the server-side using Vite's API** and article **social media cover images are automatically generated from a template SVG**. All deployed to [Netlify](https://netlify.com/) like it's any other static site generator.

This is the main piece of code that sets everything up in <a href="https://google.com"><code>blog.mjs</code></a>:

```js
import Fastify from 'fastify'
import FastifyVite from 'fastify-vite'
import renderer from 'fastify-vite-vue'
import generate from './generate.mjs'
import store from './store.mjs'
import covers from './covers.mjs'

const root = import.meta.url
const app = Fastify({ ignoreTrailingSlash: true })

await app.register(store, { root })
await app.register(covers)
await app.register(FastifyVite, { root, renderer, generate })
await app.vite.commands()
await app.listen(3000)
```

## Some background

This blog was originally built with [NuxtPress](http://localhost:3000/2019/aug/19/the-story-of-nuxt-press), an abandoned project of mine while I still worked mainly with Nuxt.js. NuxtPress was essentially a Nuxt.js plugin that would load Markdown files and provide an interface to them in pages. It didn't have much support within the Nuxt.js core team, and after some time, [an official alternative](https://content.nuxtjs.org/) was launched by Nuxt.js.

So you might be wondering: why stop using Nuxt.js at all? Why not just migrate to [Nuxt Content](https://content.nuxtjs.org/)? Or, why not just go with [Astro](https://astro.build/), the fanciest new kid on the block? Or [Eleventy](https://www.11ty.dev/), [Hugo](https://gohugo.io/), [Jekyll](https://jekyllrb.com/)? Why create something new?

In the video where I introduce [Blueprints for fastify-vite](https://www.youtube.com/watch?v=IEgev8aC8AE), I go into detail on some of the reasons why I'm no longer interested in Nuxt.js, or Next.js for that matter. But the general motivation is simplicity in tooling. I don't want to have to delegate this kind of thing to a full blown framework. Parsing Markdown entries, making them available to a web application and statically generating it should be a <u>straightforward process</u>, relying on well targeted libraries instead of subjecting myself to an entire ecosystem of architectural decisions.

Within Node.js and Fastify lie all the building blocks for a static site generator. Fastify provides the [`inject()`](https://www.fastify.io/docs/latest/Guides/Testing/#benefits-of-using-fastifyinject) utility to quickly render HTTP requests on any Fastify application without having to actually boot a server, and you can use the `fs` package to read and write files.

For convenience, I used two external **npm** packages to more easily traverse and watch for changes on the file system. More on that below.

## Crawling entries

I wrote a [Fastify plugin](https://github.com/galvez/fastify-walk) to conveniently integrate [`klaw`](https://github.com/jprichardson/node-klaw) and [`chokidar`](https://github.com/paulmillr/chokidar) in a unified API. I wanted to be able to easily traverse the filesystem looking for Markdown files, and also watch for any changes made to them. In `store.mjs`, structured as a Fastify plugin, you can see it in action loading and tracking changes on the `entries/` and `pages/` folders:

```js
await app.register(FastifyWalk, { path: root, watch: true })

app.walk.onFile('entries/**/*.md', {
  found: addEntry,
  changed: path => addEntry({ path }, true)
})

app.walk.onFile('pages/**/*.md', {
  found: addPage,
  changed: path => addPage({ path }, true)
})
```

In case I'm running a private branch of my blog with drafts and want to have them loaded, I just pass in `drafts` to the command line running locally:

```js
if (process.argv.includes('drafts')) {
  app.walk.onFile('drafts/*.md', {
    found: addEntry,
    changed: path => addEntry({ path }, true)
  })
}
```

The `store.mjs` plugin will load and track changes to Markdown files, and also takes care of converting them to HTML. Since this blog was originally built with NuxtPress, the adapted code is still using [`@nuxt/markdown`](https://github.com/nuxt/markdown), another library I wrote to support it. But it could be using [`remark`](https://github.com/remarkjs/remark) directly. The blog store is then finally added as `blog` to the app instance via [`decorate()`](https://www.fastify.io/docs/latest/Reference/Decorators/):

```js
await app.walk.ready()

app.decorate('blog', { entries, pages, featured, archive })
```

## Displaying entries and pages

To render the markup of this blog I'm using [fastify-vite](https://github.com/fastify/fastify-vite), or rather, an alpha version of its next major release. There's no documentation for this new version yet, but most of the [current documentation](https://fastify-vite.dev) applies. The new version deprecates the `useHydration()` hook in favor of specialized `usePayload()` and `useData()` hooks. 

The cool thing about [fastify-vite](https://github.com/fastify/fastify-vite) is that it's very constrained in what it does: it provides just the bare minimum structure to load and server-side render client JavaScript applications. In this case I'm using a small Vue 3 application and the [`fastify-vite-vue`](https://fastify-vite.dev/quickstart/vue.html) [renderer adapter](https://fastify-vite.dev/concepts/renderer-adapters.html).

So in a nutshell, with fastify-vite and fastify-vite-vue, all you need to get your Fastify application to render a Vue 3 component is to add a file under the `views/` directory and have it export a `path` constant setting the route. Since we also need some dynamic data from the server, we can also use `getPayload()` and `usePayload()`: the first will run on the server prior to SSR, and the other will run during SSR to access any data that was fetched. It will also work for client-side navigation, just like you'd expect `asyncData()` to work in Nuxt.js.

This is what `views/entry.vue` looks like:

```html
<template>
  <main v-html="entry.body" />
</template>

<script>
import { usePayload } from 'fastify-vite-vue/app'

export const path = '/:year/:month/:day/:title'

export function getPayload ({ req, fastify }) {
  return fastify.blog.entries[req.url.slice(1)]
}

export default {
  setup () {
    return usePayload()
  }
}
</script>
```

So this is the basic code for `views/entry.vue`. Through `getPayload()`'s context parameter we have access to `fastify` and `req`, which we can use to access the desired entry based on the full URL path (it's how `store.mjs` registers them in the `fastify.blog.entries` object).

## Generating social media covers

In order to automatically generate social media covers for each entry, I opted for a simple SVG template I could create on Inkscape. I created text boxes with placeholders following the [ES6 template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) syntax, and then saved the file so it could be used as a dynamic template.

<img src="/images/covers.png">

There are multiple other interesting solutions to do this, such as Michele Riva's [`gauguin`](https://github.com/micheleriva/gauguin) and [many others](https://github.com/topics/opengraph-images), but I managed to achieve what I needed with this simple Fastify plugin:

```js
import { readFile } from 'fs/promises'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import fp from 'fastify-plugin'
import convertSVGtoPNG from 'convert-svg-to-png'
import TemplateString from 'es6-template-string'

export default fp(async function(app) {
  const converter = convertSVGtoPNG.createConverter()
  const templatePath = resolve(dirname(fileURLToPath(import.meta.url)), 'assets', 'article.svg')
  const template = TemplateString.compile(await readFile(templatePath, 'utf8'))

  process.on('beforeExit', () => converter.destroy())

  app.get('/cover/*.png', async (req, reply) => {
    const entry = req.url.replace('/cover/', '').replace('.png', '')
    reply.type('image/png')
    reply.send(await converter.convert(template(app.blog.entries[entry])))
  })
})
```

Now, `/cover/<entry-path>.png` will work to generate covers for any existing entry.

## Hot Reload

Using a plugin like [vite-plugin-md](https://github.com/antfu/vite-plugin-md) or [vite-plugin-markdown](https://github.com/hmsk/vite-plugin-markdown) lets you treat Markdown files as local sources automatically and you get hot reload functionality in development for free. 

However, I didn't want this blog to rely on these plugins because it would keep the setup tied to the filesystem. I wanted an abstraction layer so if I ever wanted the content to come from an external database, it could. This creates two problems: how to watch for changes on the files, and how to get the frontend to hot reload when they do?

Thankfully, even though we're not using a Vite plugin to handle Markdown files, we're still using Vite and have access to the development server instance, which is nothing more than an Express middleware integrated with Fastify through `fastify-vite`. In `store.mjs`, I patched up `addEntry()` and `addPage()` to also send a custom event, as [hinted at in Vite's documentation](https://vitejs.dev/guide/api-plugin.html#handlehotupdate).

```js
const hotReloadPing = { type: 'custom', event: 'store-update' }

async function addEntry ({ path: fileName }, update = false) {
  const source = await readFile(fileName, 'utf8')
  const parsed = parseEntry(source, fileName)
  if (parsed.hidden) {
    return
  }
  const title = extractTitle(parsed.content)
  const url = genURL(fileName, title, parsed.date)
  const entry = {
    url,
    title,
    featured: parsed.featured,
    date: parsed.date,
    published: parsed.published,
    excerpt: parsed.excerpt,
    id: genID(parsed.date, url),
    body: await markdown(extractBody(parsed.content))
  }
  if (update && pathMap[fileName]) {
    Object.assign(pathMap[fileName], entry)
  } else {
    entries[url] = entry
    pathMap[fileName] = entry
    addToArchive(entry)
  }
  if (update) {
    app.vite.devServer.ws.send(hotReloadPing)
  }
}
```

Now, every time a file changes, we notify the frontend through Vite's WebSocket connection. I still needed to change `views/entry.vue` a little to actually listen to these changes and reload the content display. I do so using `import.meta.hot`, made available by Vite. But more importantly, since the request path is the entry ID itself, I also needed to change `getPayload()` to remove `/-/payload` from it, if present. This is because `fastify-vite` lets you retrieve a route's payload via an automatically generated endpoint which follows the format `/-/payload<url>`.


```js
import { reactive } from 'vue'
import { useRoute } from 'vue-router'
import { usePayload, fetchPayload } from 'fastify-vite-vue/app'

export const path = '/:year/:month/:day/:title'

export function getPayload ({ req, fastify }) {
  return fastify.blog.entries[req.url.replace('/-/payload', '').slice(1)]
}
```

During SSR, `getPayload()` is executed automatically and `req.url` will be the original route path. But if you use `fastify-vite`'s `fetchPayload()` helper to retrieve a route's payload on-demand, the URL will be prefixed with `/-/payload`. With this fix in place, the next step is to set up a listener to the `store-update` custom event that will update the live view:

```js
export default {
  setup () {
    const state = reactive({ entry: null })
    if (import.meta.hot) {
      const route = useRoute()
      import.meta.hot.on('store-update', async () => {
        state.entry = await fetchPayload(route)
      })
    }
    state.entry = usePayload()
    return state
  }
}
```

See it in action on the video below:

<video controls autoplay muted loop>
  <source src="/videos/hotreload.mp4" type="video/mp4">
</video>

## Static Generation

Static generation is [handled by `fastify-vite`](https://fastify-vite.dev/deployment/static-generation.html). It'll prerender all available URLs, and pregenerate the cover image PNG files for each entry locally so when it's deployed to Netlify it doesn't have to run Chromium on the server because images will already be made available when you do a test build locally. The `generate` settings are in `generate.mjs`:

```js
import { existsSync } from 'fs'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export default {
  paths (app, add) {
    add('/')
    add('/about')
    add('/archive')
    add('/videos')
    add('/influences')
    for (const entry of Object.keys(app.blog.entries)) {
      add(`/${entry}`)
    }
  },
  async done (app) {
    const imagesDir = join(app.vite.options.root, 'public', 'images')
    for (const url of Object.keys(app.blog.entries)) {
      const imageName = `${url.replace(/\//g, '-')}.png`
      if (!existsSync(join(imagesDir, imageName))) {
        const response = await app.inject({ url: `/cover/${url}.png` })
        await writeFile(join(imagesDir, imageName), response.rawPayload)
        console.log(`ℹ generated /images/${imageName}`)
      }
    }
  }
}
```

This is how long it takes to generate:

<video controls autoplay muted loop>
  <source src="/videos/generate.mp4" type="video/mp4">
</video>


## Source Code

You can get the source code here: [https://github.com/galvez/blog](https://github.com/galvez/blog).

- `entries/*.md`: Markdown source files for blog entries.
- `pages/*.md`: Markdown source files for blog pages.
- `views/archive.vue`: View for displaying the blog archive.
- `views/entry.vue`: View for displaying blog entries.
- `views/page.vue`: View for displaying blog pages.
- `views/videos.vue`: View for displaying blog videos.
- `views/index.vue`: View for displaying the blog index with featured entries.
- `router.vue`: The main wrapping layout for the [Vue Router](https://next.router.vuejs.org/) view.
- `markdown.mjs`: Functions to convert Markdown to HTML.
- `store.mjs`: Markdown source crawler and blog data store.
- `covers.mjs`: Fastify plugin to generate social media covers.
- `generate.mjs`: Static generation settings.
- `blog.mjs`: The entry point, a Fastify application.

## Wrapping up

Getting this blog running represents a big milestone for [fastify-vite](https://fastify-vite.dev/). 

I hope to be able to reproduce the same setup using other renderer adapters, especially the [Solid](https://www.solidjs.com/) one which is getting ready for the v3 release. 

I am personally happy using Vue 3 and don't think I'll be changing this codebase too significantly for the foreseeable future, except maybe for the CSS which is kind of a mess right now — c'est la vie.

