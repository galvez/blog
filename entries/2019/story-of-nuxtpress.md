---
date: August 19, 2019
---

# The Story of NuxtPress

> **TL;DR**: [NuxtPress v0.0.1-beta][np-beta] is out. This blog is built with it. Its own documentation is built with it. Check out [some examples](https://github.com/nuxt/press/tree/master/examples). It is **still beta** and needs more testing. Please [file bugs and feature requests](https://github.com/nuxt/press/issues/new) if you try it.<br><br>
> Read on for a **lot more details**.

About a year ago, I released the [first version of this blog's source code][nuxpress]. It was as a rather elaborate Nuxt boilerplate: loading Markdown files from the file system and using [middleware][midd] to very crudely inject rendered content into pages. 

[midd]: https://nuxtjs.org/api/pages-middleware/

My blog ran fine with it, but it had a couple of caveats: no client-side `VueRouter`-based navigation and duplicated markup content delivered inside Nuxt's [hydration payload][hp]. Also, reusing it on other projects meant copying a lot of code around.

[nuxpress]: https://github.com/galvez/nuxpress
[hp]: https://ssr.vuejs.org/guide/hydration.html

## Is Nuxt a static site generator?

 Yes, if you want it to be. 
 
 [Nuxt][nuxt] is primarily a [Vue.js][vue] framework that allows you to build just about any kind of web application.
 
 For reasons I've [explored in the past][about-nuxt], I think it hits a sweet spot of abstraction: work with a regular Node app server, with a Vue.js app on top and all the build code to glue it all together. Add to that a thin runtime layer providing a middleware engine and [`asyncData()`][async-data] and you've got yourself a Nuxt.

[vue]: https://vuejs.org
[about-nuxt]: https://hire.jonasgalvez.com.br/2018/aug/12/the-thing-about-nuxt
[async-data]: https://nuxtjs.org/guide/async-data/

Having said that, the ability to [generate a static bundle][nuxt-generate] is a **secondary feature** of Nuxt. When compared to frameworks like [Gridsome][gridsome] and [Gatsby][gatsby], that place their primary focus on static generation, Nuxt was bound to leave some users [disappointed][nuxt-rant].

[nuxt-generate]: https://nuxtjs.org/api/configuration-generate/
[gridsome]: https://gridsome.org/
[gatsby]: https://www.gatsbyjs.org/
[nuxt-rant]: https://suxin.space/notes/nuxt-bloated-markdown-blogs/

How can we make things better? As Evan You [pointed out][evan-tweet]:

[evan-tweet]: https://twitter.com/youyuxi/status/1142288779408842754

> I think as developers we need to battle this **"don't adopt anything from your competitor"** mindset. A good idea doesn't become a bad idea just because it came from a project that you didn't like (before the idea was created).

I spent some time reading about **Gridsome** and **Gatsby** in an attempt to understand what things they got right and how hard would it be to bring them to the Nuxt stack. I was inspired by both. I liked Gridsome's concept of [managed pages][g-mp] and [programmable data sources][g-data-sources], which seem to have equivalences in Gatsby.

[g-mp]: https://gridsome.org/docs/pages-api
[g-data-sources]: https://gridsome.org/docs/fetching-data

Both frameworks seem pretty solid to me and it makes no sense to advocate Nuxt over them if they already work well for you. 

I didn't like the API so much though. If you are already using Nuxt for web development, chances are you want some of these features. But you still want them [*_the Nuxt way_*][about-nuxt]: with **dead simple APIs** and **convention over configuration** as much as possible.

Very few people are familiar with the power of Nuxt's [Module Container API][container-api]. It offers so much granular control over Nuxt build process aspects that you can pretty much make your very own framework with it. Armed with the experience I had building a few Nuxt modules in the past, I began rewriting [nuxpress][nuxpress] as one. 

[container-api]: https://nuxtjs.org/api/internals-module-container/

## Solving the data source problem

I wanted to address [Sasha's main concern][nuxt-rant], that is, the static content hydration problem. But I also wanted to bring some of that _Nuxt magic_ to Markdown publishing, and by **_Nuxt magic_** I mean: things should **_just work_**. In fact, Markdown files should automatically register routes if placed under `pages/`, just like [Nuxt pages][nuxt-pages]. 

[nuxt-pages]: https://nuxtjs.org/guide/views/

There's [an active Nuxt RFC][rfc] suggesting the implementation of **_full_** static generate. [Alexander Lichter][lichter] writes:

[rfc]: https://github.com/nuxt/rfcs/issues/22
[lichter]: https://github.com/manniL

> Instead of relying on the API calls, we should *inline* the response of the `asyncData` method(s) inside a `.json` file (per page) when the `generate.fullStatic` flag is enabled in the `nuxt.config.js` (the flag name is debatable). Then we can use the `.json` file as data source without issues.

That seems to be what Gridsome did for their [v0.6][g-static] release:

[g-static]: https://gridsome.org/blog/2019/05/10/gridsome-v06/

> From now on, **page data will be stored as raw JSON files without interference from webpack**. And **each file is prefetched and loaded on demand for each page**. The overall JavaScript size is reduced by about 30% in most cases.

This is available in Nuxt today in two flavors: 

- the [nuxt-payload-extractor][npe] module by [DreaMinder](https://github.com/DreaMinder), which was [adopted in nuxtjs.org][nuxtjsorg] for the time being;
- and my own [nuxt-static-render][nsr] module, which has granular control over hydration but no automatic extraction of page payloads.

**[nuxt-payload-extractor][npe]**'s automated approach can work remarkably well for most static Nuxt apps.

[npe]: https://github.com/DreaMinder/nuxt-payload-extractor
[nuxtjsorg]: https://github.com/nuxt/nuxtjs.org/tree/master/modules/static
[nsr]: https://github.com/galvez/nuxt-static-render

# Introducing NuxtPress

I set out to implement a Nuxt module that employs these techniques while automating as much of the configuration as possible. I also wanted a flexible data loading API, one that could seamlessly work with the file system as well as with a remote API.

In the spirit of favoring [boring technology][bt], I chose a simple **REST API**: what if we simply made it so that every request to Nuxt also yields a silent API request for the URL requested? Say, a request to `/about` will silently try to load data from `/api/source/about`. A request to `/` silently makes a request to `/api/source/index`. 

[bt]: http://boringtechnology.club/

What if we could enable this generic `/api/source/:path` API and make it automatically translate requests to **statically available, prefetchable JSON files** if your app is built with `nuxt generate`?

That is how this blog is rendered now, with [NuxtPress v0.0.1][np]. Loading an entry from the index page is just a JSON file away, and if you access the URL directly you get the **static, prerendered version**.

![Static JSON Fetch](/images/static-json-fetch.png)

[np]: https://nuxt.press
[nuxt]: https://nuxtjs.org

At its core, NuxtPress will search for `.md` files in the `pages/` directory and build Nuxt routes based on them in a fashion very similar to Nuxt's own handling of `.vue` files. To get that working in any Nuxt app:

```shell
$ npm install @nuxt/press --save
```

Edit your `nuxt.config.js`:

```js
export default {
  modules: ['@nuxt/press']
}
```

With that, [`.md` files will be recognized under `pages/`][np-pages]. You can even set the [Nuxt layout][nlayout] and use [YAML metadata][gm] for rendering.

[gm]: https://github.com/jonschlinkert/gray-matter

`pages/foo/bar.md` → `/foo/bar`

Links are automatically converted to [NuxtLink][nlink] (so that `VueRouter`-based navigation works) and you can also use Vue template markup, with [some caveats][np-vue-caveats]:

[np-pages]: https://serene-lamarr-39961d.netlify.com/guide#markdown-pages
[nlayout]: https://nuxtjs.org/api/pages-layout/
[np-vue-caveats]: https://serene-lamarr-39961d.netlify.com/customize#using-components
[nlink]: https://nuxtjs.org/api/components-nuxt-link/

```md
---
layout: custom
someText: hey, this works!
---

# Hello world

Go to [/subpage](/subpage)

Here's some text: {​{ $press.source.someText }}
```

## Blueprints

Problem is, placing files under `pages/` doesn't work so well for some apps. In a blog, for example, you wouldn't want to manually maintain a directory structure that reflects the chronological nature of entries. You just want to drop files into an `entries/` directory and let each entry's metadata determine its final URL.

Internally, NuxtPress uses the concept of _app blueprints_ to run.

The basic ability to build page routes from Markdown files comes from the `common` bundled app, which is always enabled by default and supports other NuxtPress bundled apps. In NuxtPress' [module entry point][np-entry-point] you'll see the following:

[np-entry-point]: https://github.com/nuxt/press/blob/master/src/index.js

```js
const blueprints = ['docs', 'blog', 'slides', 'common']
await registerBlueprints.call(this, 'press', options, blueprints)
```

Each blueprint definition has an `enabled()` method that determines whether or not the blueprint's files should be added to your app's bundle. The `docs` app for example will only be enabled in your Nuxt app if your source directory contains a `docs` folder or if you've specifically configured NuxtPress to run in [_docs standalone mode_][standalone-mode]. In the [docs blueprint soure][docs-blueprint], you'll find:

[standalone-mode]: https://serene-lamarr-39961d.netlify.com/guide/mode-standalone
[docs-blueprint]: https://github.com/nuxt/press/blob/master/src/blueprints/docs/index.js

```js
enabled (options) {
  if (options.$standalone === 'docs') {
    options.docs.dir = ''
    options.docs.prefix = '/'
    return true
  }
  return exists(this.options.srcDir, options.docs.dir)
}
```

Each bundled app has its own Markdown loader. 

The `docs` app is essentially a minimal [VuePress][vp]-like Nuxt app, loading files from the source directory and building a _book view_ with table of contents. See [NuxtPress' own docs][np-docs] for an example.

[np-docs]: https://serene-lamarr-39961d.netlify.com/

The `blog` app includes a blog view and will build URLs based on the publication date of entries, like you see right here on this blog.

There's also an experimental `slides` app that will build a slideshow based on Markdown source files, similar to [mdx-deck][mdx-deck].

[vp]: https://vuepress.vuejs.org
[mdx-deck]: https://github.com/jxnblk/mdx-deck

See more about NuxtPress' bundled apps in the [documentation][np-docs].

## Automated Full Static Generate

[Sébastien Chopin][seb] has [worked on wiring](https://github.com/nuxt/nuxt.js/pull/6159) the [full static RFC][rfc] into Nuxt's core, but right now we can take advantage of the HTTP data source API I described earlier, which also helps us solve the problem of being able to provide custom data sources. 

Below is a snippet (edited for brevity) from the middleware responsible for retrieving data sources in NuxtPress:

[seb]: https://github.com/Atinux

```js
if (!source) {
  source = await $press.get(`api/source/${sourceParam}`)
}

if (!source) {
  source = await $press.get(`api/source/${sourceParam}/index`)
}
```

In a pre-rendered application (built with `nuxt generate`), you get static markup ready for display, but you still want to keep the app working for subsequent client-side navigation (`VueRouter`).

So **one way** to turn a live Nuxt app into a statically rendered one is to ensure these API requests keep working on the client-side:

```js
function getSourcePath(path) {
  return `/_press/sources/${path}.json`
}

function $json (url) {
  return fetch(url).then(r => r.json())
}

const apiPath = '/api/source'

if (process.static && process.client) {
  press.get = (url) => {
    if (url.startsWith(apiPath)) {
      return $json(getSourcePath(url.slice(apiPath.length + 1)))
    } else {
      return $json(url)
    }
  }
} else {
  press.get = url => ctx.$http.$get(url)
}
```

In Nuxt's universal mode, NuxtPress will load all data from the base `/api/` endpoint, which is handled via Nuxt [serverMiddleware][nuxt-sm]. It includes endpoints which are specific to the `docs`, `blog` and `slides` apps, and the `/api/source` endpoint which is used by all of them.

[nuxt-sm]: https://nuxtjs.org/api/configuration-servermiddleware/

> All API handlers can be overriden which means you can hook any CMS API into NuxtPress. 

But if you just want to deploy static files to [Netlify][netlify], users will get prerendered pages on first render, and **automatically prefetched JSON-hydrated pages** for client-side navigation.

[netlify]: https://netlify.com

## Avoiding client-side hydration

The basic Vue template for NuxtPress pages looks like this:

```html
<template>
  <nuxt-static
    tag="main"
    :source="$press.source.body" />
</template>

<script>
export default {
  middleware: 'press',
  layout: ({ $press }) => $press.layout
}
</script>
```

The actual source code is slightly more complex as it involves conditionally registering components based on the enabled apps. 

But notice how there's no `data()` or `asyncData()`?

That's because data is stored directly injected in Vue's context. So it doesn't get serialized into __NUXT__ and delivered in a `<script>` tag in addition to the prerendered markup. 

This is made possible with the `<NuxtStatic>` component that NuxtPress introduces, which ensures the component stays static on the client-side. This of course might not always be desirable.

> In Nuxt 2.9+ there will be absolutely no need for `<nuxt-static>` as `asyncData` payloads will be automatically inlined as JSON.

If you're embedding Vue components inside your Markdown source files, you'll want to [eject and replace][np-eject] the original templates with `asyncData()` and `<NuxtTemplate>` instead:

[np-eject]: https://serene-lamarr-39961d.netlify.com/customize#ejectable-templates

```html
<template>
  <nuxt-template
    tag="main"
    :source="source.body" />
</template>

<script>
export default {
  middleware: 'press',
  layout: ({ $press }) => $press.layout,
  asyncData: ({ $press }) => ({ source: $press.source })
}
</script>
```

`<NuxtTemplate>` is another component NuxtPress introduces that allows for dynamic rendering of Vue template markup. That means your Markdown-generated HTML markup can also be powered by Vue templating features. This requires NuxtPress to build apps using Vue's [full build][vue-builds]. You can disable Vue in Markdown altogether and use Vue's smaller runtime build if you want. If you do, `<NuxtTemplate>` switches to using `v-html` for rendering dynamically loaded HTML.

[vue-builds]: https://vuejs.org/v2/guide/installation.html#Explanation-of-Different-Builds

> The downside of `asyncData()` is that for lengthy HTML content, that means also delivering a big `__NUXT__` payload. This is why NuxtPress introduced `<NuxtStatic>`. For most apps though, the performance impact on first render might not be noticeable at all, given all the caching and compression strategies available in modern HTTP servers.

## Ejectable source code

Another cool feature we're testing in NuxtPress is template _ejection_ and _shadowing_. 

```sh
$ npx nuxt-press eject blog
```

The above command, for instance, will eject all the source code for blog app, allowing you to completely modify it to your needs, should you need to. Under `press/`, you'll find every single file composing the blog app. Just a regular Vue app:

```sh
blog/
├─ components/ 
│  ├─ entry.vue
│  └─ sidebar.vue
├─ layouts/ 
│  ├─ blog.vue
├─ pages/ 
│  ├─ archive.vue
│  ├─ index.vue
├─ head.js
└─ rss.xml
```

⁂

[NuxtPress v0.0.1-beta][np-beta] is out for early adopters willing to help us deliver a great Markdown experience for Nuxt developers. Make sure to [file issues][np-issues] and don't forget to join our [Discord channel][nuxt-discord] for support.

[np-beta]: https://nuxt.press/
[np-issues]: https://github.com/nuxt/press/issues
[nuxt-discord]: https://discord.nuxtjs.org/

### VuePress Feature Parity

Although NuxtPress bundled docs app is fairly robust, I can't say there's feature parity with [VuePress][vp] at this stage. It is however a **rather hackable Nuxt app underneath**, as with all apps bundled with NuxtPress: **they're all vanilla Nuxt apps under the hood**, leveraging NuxtPress Markdown filesystem loader and sources API. You can eject the entire docs app source code into your codebase and add any missing features that you'd like. You can also customize the Markdown processor used for loading documentation files.

### Contributing

This early beta release welcomes anyone who wants to join the effort. Here are a few areas that could use attention:

- **Themes**: all bundled apps come with default themes that are currently very basic and could receive several aesthetic and potential UX enhancements. If you improve anything in the stylesheets, please [submit a PR][pr] with a screenshot.

- **Documentation**: needs revisions, tutorials and examples covering advanced usage of all bundled apps. If you make a new example and think it should be in `examples/`, please [submit it][pr].

[pr]: https://github.com/nuxt/press/pulls

Contributing is extremely easy, just pull the [nuxt/press repository][npr], install NPM dependencies and use the `dev` script to test your changes directly in the bundled examples. If you change something in `src/blueprints/blog`, you'll want to test with your changes with:

[npr]: http://github.com/nuxt/press

```js
npm run dev examples/blog
```

Just knowing Vue and Nuxt is enough to contribute to NuxtPress bundled apps, thanks to its _blueprints architecture_.

### Acknowledgements

This endeavour would have not been possible without my employer [STORED e-commerce][stored], which fully supports my open source work contributing to the Nuxt project.

[stored]: https://stored.com.br

Thanks to Nuxt cocreator [Sébastien Chopin][seb], who provided much needed insights along the way and fellow Nuxt Team member [Pim](https://github.com/pimlie), who delivered an amazingly minimal yet functional **docs app** and also bootstrapped the entire project's test suite.

Also thanks to [Darek Wędrychowski](https://twitter.com/gustojs), [Eduardo San Martin Morote](https://github.com/posva) and fellow Nuxt Team members [Dmitry Molotkov](https://twitter.com/aldarund) and [Pooya Parsa](https://twitter.com/_pi0_) for reading drafts of this article.

### Other resources

- [Nuxt Markdown Blog Starter](https://github.com/marinaaisa/nuxt-markdown-blog-starter): a rather sweet Nuxt starter boilerplate by [Marina Aisa](https://github.com/marinaaisa) using [frontmatter-markdown-loader][fml]. In this approach Markdown sources go fully through Webpack.
- [Including Markdown Content in a Vue or Nuxt SPA](https://vuejsdevelopers.com/2018/12/31/vue-nuxt-spa-markdown/): Another take on a [frontmatter-markdown-loader][fml]-based approach by [VueJSDevelopers](http://vuejsdevelopers.com) editor [Anthony Gore](https://www.patreon.com/anthonygore).

[fml]: https://www.npmjs.com/package/frontmatter-markdown-loader
