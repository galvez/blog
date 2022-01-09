---
date: August 12, 2018
---

# The Thing About Nuxt

A little over 10 years ago, Ryan Tomayko wrote [_The Thing About Git_][], in a
time where [SVN][] was still heavily used.

[]: https://tomayko.com/blog/2008/the-thing-about-git
[]: https://en.wikipedia.org/wiki/Apache_Subversion

Few people understood why Git was so special and I wasn't among them at the time.
Ryan's article captured the essence of Git and convinced me to make the switch.


I've addressed the issue of Vue and React [before][]. Poorly, if I might add. 
[This Reddit thread offers a much better explanation][]. The same argument 
applies when comparing [Nuxt][] and [Next][], which are based on Vue and React 
respectively. 

[]: http://hire.jonasgalvez.com.br/2017/Jun/23/Why-Choose-Vue.js
[]: https://www.reddit.com/r/javascript/comments/8o781t/vuejs_or_react_which_you_would_chose_and_why/
[]: https://nuxtjs.org/
[]: https://nextjs.org/

In the few times I did React work, I had to spend days coming up with the 
perfect boilerplate and build scripts, which to me always looked inevitably 
bloated. I just noticed there would always be too much going on, even for 
the simplest application. 

Remember Steve Yegge's [Code's Worst Enemy][] piece from 2007?

[]: http://steve-yegge.blogspot.com/2007/12/codes-worst-enemy.html

> "I happen to hold a hard-won minority opinion about code bases. In 
> particular I believe, quite staunchly I might add, that **the worst thing 
> that can happen to a code base is size**."

With React, I had a bloated code base starting with the boilerplate.

I tell everyone I'm a minimalist, but at the same time, I have noticed when 
other people tell me they're minimalists, I'm just as likely to think they're 
lazy and unattentive as they're concise and efficient.

I think both these kinds of minimalists exist, and it might just be to some 
extent, the prejudice against the former that makes React developers 
unimpressed by Vue's minimal API. 

Or as Steve Yegge goes on to say:

> I say "size" as a placeholder for a reasonably well-formed thought for which 
> I seem to have no better word in my vocabulary. I'll have to talk around it 
> until you can see what I mean, and perhaps provide me with a better word for 
> it. [...] **unfortunately most so-called experienced programmers do not know
> how to detect bloat, and they'll point at severely bloated code bases and 
> claim they're skinny as a rail**.

Nuxt is the best attempt I've seen in my entire programming career to deliver 
exactly that: a bloat-free codebase. **I've never seen** any codebase as 
skinny as they are with Nuxt. Not with any PHP framework. Not with Ruby on 
Rails. Not with any Python framework. Not with Go. **Never**. Nuxt's conventions
were perfect for architecting every app I built with it. In an ecosystem that is
[known for its endless fragmentation and complexity][], that's rather amazing.

[]: https://hackernoon.com/how-it-feels-to-learn-javascript-in-2016-d3a717dd577f

## A command worth a thousand configurations

If you `npm install -g nuxt-edge` ([soon to be Nuxt 2][]), **`nuxt dev`** 
will just work in any directory. It'll look for a `nuxt.config.js` file, but 
you don't need one  just yet. Just add a Vue [SFC][] to `pages/` and you have 
a working route:

[]: https://twitter.com/nuxt_js/status/1027209607532478466
[]: https://vuejs.org/v2/guide/single-file-components.html

1. `mkdir pages`
2. `echo "<template><p>Hello</p></template>" > pages/index.vue`
3. `nuxt dev`
4. Open `http://localhost:3000/` in your browser.

Of course, as your app grows, you'll need dependencies, a proper `package.json` 
file and to run `npm install` on your project's root directory. But the ability
to start with minimal effort like this is a luxury I'll never give up.

_Mad props to [Clark Du][] for [getting this to work][]_.

[]: https://github.com/clarkdo
[]: https://github.com/nuxt/nuxt.js/pull/3647

## The right conventions

So what are these great conventions?

Nuxt borrows some code organization ideas from Next and is already blessed 
with Vue's own philosophies.

1. Your views are Vue [**single file components**][] that go into `pages/`. You 
can't change the name of this directory. You can change the routes themselves, 
but you can't change where the files are kept. If you don't change the default
behavior, the directory structure of `pages/` is used to map the routes.

[]: https://vuejs.org/v2/guide/single-file-components.html

2. In addition to `pages/`, you may add `assets/`, `static/`, `middleware/`, 
`layouts/` and `components/`. These names are pretty much self explanatory.
Assets are automatically loaded via Webpack when referenced in pages, static 
files are automatically served in `/`, [middleware functions][] run before route 
changes, layouts define [structure for pages][] and components hold the Vue
components (or even [Vue SFCs that compile to native Web Components][]) that are 
optionally used by pages.

[]: https://nuxtjs.org/api/pages-middleware/
[]: https://nuxtjs.org/api/pages-layout
[]: https://vuejsdevelopers.com/2018/05/21/vue-js-web-component/

# Painless deployment options

There's not much else to it. Well, [there is][]. 

But this is enough to build a lot of apps elegantly and hassle-free. Want 
to deploy on a Node server with SSR? You get that [built-in][]. Want to use
an existing Koa or Express server? Use the [Nuxt.render()][] middleware. 
Want a client-side app? Use [SPA mode][].

[]: https://nuxtjs.org/api
[]: https://nuxtjs.org/guide/commands
[]: https://nuxtjs.org/api/nuxt-render
[]: https://nuxtjs.org/api/configuration-mode/

## My experience with Nuxpress

Check out [these][] [other][] articles to see more people wax lyrical about 
Nuxt. I'll wrap up with my experience writing [Nuxpress][], the static blogging 
software this website is built with. My thought process with Nuxpress went like this:

[]: https://medium.com/vue-mastery/10-reasons-to-use-nuxt-js-for-your-next-web-application-522397c9366b
[]: https://codeburst.io/why-nuxt-js-is-perfect-framework-for-your-landing-page-53e214649b88
[]: https://github.com/galvez/nuxpress

1. I need to list markdown files available before the build.
2. Hm, `nuxt.config.js` gets loaded before the build. 

_Adds code to [`nuxt.config.js`][]_.

[]: https://github.com/galvez/nuxpress/blob/master/nuxt.config.js

3. I need to inject the data into my pages.

_Adds code to [`plugins/`][]_.

[]: https://github.com/galvez/nuxpress/blob/master/plugins/nuxpress.js

4. I need to actually load the markdown entries.

_Adds code to [`middleware/`][]_.

[]: https://github.com/galvez/nuxpress/blob/master/middleware/nuxpress.js

5. I need to display the markdown entries.

_Adds code to [`pages/entry.vue`][]_.

[]: https://github.com/galvez/nuxpress/blob/master/pages/entry.vue

6. I need custom routes.

_Adds code to [`extendRoutes()`][] in `nuxt.config.js`_.

[]: https://vuejsdevelopers.com/2018/07/16/7-tips-large-nuxt-app-vue/

The less I have to think about where and in what order code runs, the more 
productive I am. Nuxt's conventions have become so natural to me I rarely
have to look up documentation for them.

This is why I'm now [contributing to Nuxt][] and don't plan on replacing 
it as my core stack for building apps in the foreseeable future.

[]: https://github.com/nuxt/nuxt.js/graphs/contributors
