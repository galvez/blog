---
date: August 25, 2017
---

# Leaving Python for JavaScript

After over 10 years using Python as main my programming language, I have moved
on to JavaScript (the [ES8][] specification). Python still remains my second 
main language, as I'm actively involved in a Django-powered project, still 
maintain [xmlwitch][] and use tons of private scripts written in Python every
day. But it's true, I can now say I really prefer JavaScript over Python. And
it's not just me — [everyone seems to be following suit][].

[]: https://hackernoon.com/es8-was-released-and-here-are-its-main-new-features-ee9c394adf66
[]: https://github.com/galvez/xmlwitch
[]: https://dev.to/anthonydelgado/javascript-is-eating-the-world

Not only as a tool that helps me deliver working products, but also as a 
language, for the sheer satisfaction I have working with it. The thought might
be heretic to some good Pythonistas I know — I was shocked myself when I read
about [Ian Bicking moving on too][] — but it doesn't take much to explain it.

[]: http://www.ianbicking.org/blog/2014/02/saying-goodbye-to-python.html

While indentation-based scoping has always been a huge plus for me in Python,
class definition boilerplate is still hard to look at. List comprehensions and
generator expressions go a long a way, but unable to beat the expressiveness of
JavaScript for me.

Also, **there's no acceptable way to pass a function body to another in Python**.
My code usually revolves around _higher order functions_, `reduce()`, `map()`, 
`forEach()` etc. I can't remember the last time I wrote a regular for loop.

So with JavaScript you've got [arrow functions][], the [method shorthand
definition syntax][], the [spread operator][], [destructuring assignments][],
[all functional Array methods][] and [async functions][]. Combined with 
[Vue][]'s minimal patterns and [Nuxt][]'s conventions, I can't think of a 
better language to write web applications with.

[]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Functions/Arrow_functions
[]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Method_definitions
[]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Operators/Spread_operator
[]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
[]: http://eloquentjavascript.net/1st_edition/chapter6.html
[]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
[]: https://vuejs.org/
[]: https://nuxtjs.org

## Backend

The last project I started using a [Flask][] backend was a little over three 
months ago. Since then, I worked on so many client-side **and** server-side 
rendered JavaScript applications that I've grown completely accostumed to the
ways of [Koa][] and [async/await][].

[]: http://flask.pocoo.org/
[]: http://koajs.com/
[]: https://hackernoon.com/6-reasons-why-javascripts-async-await-blows-promises-away-tutorial-c7ec10518dd9

[Nuxt][] is very opinionated but has very hackable internals. I would describe 
[Koa][] as meticulously minimalist and precise, it's definitely very pleasant
to work with and has proven to be production-ready on a number of projects.

[]: https://nuxtjs.org
[]: http://koajs.com/

When working with Nuxt, I usually place server-side only (non-Nuxt) pieces 
under `/api` (with [koa-router][]) and then prevent [`nuxt.render()`][] from 
running under that route.

[]: https://github.com/alexmingoia/koa-router
[]: https://nuxtjs.org/api/nuxt-render/

```js
app.use((ctx) => {
  if (!ctx.request.path.startsWith('/api')) {
    ctx.status = 200
    return new Promise((resolve, reject) => {
      ctx.res.on('close', resolve)
      ctx.res.on('finish', resolve)
      nuxt.render(ctx.req, ctx.res, (promise) => {
        promise.then(resolve).catch(reject)
      })
    })
  }
})
```

My `package.json` basic dependencies are: [dotenv][] (lets you load the 
environment from an `.env` file), [axios][] (HTTP client library), [cheerio][]
(HTML parsing library), [bcrypt][] (password hashing), [co-body][] (HTTP body
parser), [co-busboy][] (HTTP multipart parser), [jsonwebtoken][] (JWT 
generator), [koa-jwt][] (JWT middleware), [koa-router][], [koa-sslify][], 
[vue-no-ssr][] and [source-map][].

[]: https://www.npmjs.com/package/dotenv
[]: https://www.npmjs.com/package/axios
[]: https://www.npmjs.com/package/cheerio
[]: https://www.npmjs.com/package/bcrypt
[]: https://www.npmjs.com/package/co-body
[]: https://www.npmjs.com/package/co-busboy
[]: https://www.npmjs.com/package/jsonwebtoken
[]: https://www.npmjs.com/package/koa-jwt
[]: https://github.com/alexmingoia/koa-router
[]: https://www.npmjs.com/package/koa-sslify
[]: https://www.npmjs.com/package/vue-no-ssr
[]: https://www.npmjs.com/package/source-map

I follow the [Twelve-Factor App][] methodology in architecting applications and
recommend [Google Cloud Platform][] and [Kubernetes][] in all my projects, but
have seen successful container deployments with AWS. I still need to explore 
**HTTP/2**, especially now [it has made into Node's core][].

[]: https://12factor.net/
[]: https://cloud.google.com/
[]: https://kubernetes.io/
[]: https://github.com/nodejs/node/pull/14811

If I ever need better performance on the backend, I'm more inclined to look at 
Go (which I've used in the past and like very much) and [Otto][] (or [Goby][])
than Python again. Goby are Otto are incredible ideas — having a Go-powered Nuxt
application would cover a much wider range of applications.

[]: https://github.com/robertkrimen/otto
[]: https://github.com/goby-lang/goby

## Frontend

In addition to [Nuxt][] and [Vue][], [iView][] and [Sass][] power most of 
my frontend code. iView is comparable to [ElementUI][], but has worked better
for my projects so far (despite [my initial excitement with ElementUI][]). 
Nuxt routes are automatically built from the file system for convenience, but 
can be easily extended.

[]: https://nuxtjs.org
[]: https://vuejs.org/
[]: https://www.iviewui.com/
[]: http://sass-lang.com/
[]: http://element.eleme.io/
[]: http://hire.jonasgalvez.com.br/2017/Jul/23/Nuxt-and-ElementUI

You'll want to keep [vue-no-ssr][] around for dealing with non-SSR friendly 
Vue dependencies.

[]: https://www.npmjs.com/package/vue-no-ssr

I have always avoided CSS transpilers, and while I enjoy curly braces in 
JavaScript (it's hard to imagine indentation-scoped JavaScript), I find them
unnecessary in CSS. Eliminating the need for curly braces (and semicolons) in
CSS makes the code easier to read and scroll through, **especially when using
single file components as a development convention**.

## Others

Nuxt's build tools have been sufficient for my projects so far.

I'm keeping an eye on [Brunch][] though. I used Brunch recently and while I was
presented with some of its shortcomings, I was also impressed with its speed and
simplicity. Once it gets a little closer to Webpack's feature set, I wouldn't be
surprised if the Nuxt team decided to migrate to it.

[]: http://brunch.io/

I mainly use [Sublime Text][], [ack][] and [integrated eslint][] (configured
to use [StandardJS][]) for my programming, and [ColorSnapper 2][],
[Sketch][] and Photoshop for my UI/UX design needs.

[]: https://www.sublimetext.com/
[]: https://beyondgrep.com/
[]: https://nuxtjs.org/guide/development-tools/
[]: https://standardjs.com/
[]: https://colorsnapper.com/
[]: https://www.sketchapp.com/

Article cover adapted from [photo by Frank McKenna][] on [Unsplash][].

[]: https://unsplash.com/photos/tjX_sniNzgQ
[]: https://unsplash.com
