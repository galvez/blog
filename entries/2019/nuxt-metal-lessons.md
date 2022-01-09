---
date: April 26, 2019
---

# Revamping Nuxt's HTTP Server

There are some big plans for Nuxt 3. As mentioned by [Sébastien Chopin][] in 
his [Vue.js Amsterdam 2019 talk][], the next major version of [Nuxt][] will 
integrate a backend services and workers framework. Nuxt Services will leverage 
WebSockets and try to deliver the robustness of GraphQL and the simplicity 
of RESTful APIs.

[]: https://www.youtube.com/user/atinux
[]: https://www.youtube.com/watch?v=m0UtuJoigvQ
[]: http://nuxtjs.org

## Dissecting Connect

Nuxt currently uses [connect][], a small and efficient HTTP middleware and 
routing framework. As I became involved with the Nuxt Services project, I 
decided to dive into **connect** and learn more about it. I learned for 
instance that its first release is from **9 years ago** and that itself is
based on several other libraries: [on-finished][] is used for determining the 
end of a request, which itself uses [ee-first][] to listen for the first of a 
series of possible events. It also uses [finalhandler][] for, well, its
final cleanup request handler.

[]: https://github.com/senchalabs/connect
[]: https://github.com/jshttp/on-finished
[]: https://github.com/jonathanong/ee-first
[]: https://github.com/pillarjs/finalhandler

I set out to try and restructure **connect** as a brand new package for Node 10+: 
[**@nuxt/metal**][]. Bundled with everything it needs plus a couple of new
features: **async handling** and **RegExp-based routing**. I also wanted to update 
the code to use modern JavScript constructs like `const` and arrow functions, 
and also get rid of all semicolons!

[]: https://github.com/nuxt/metal

## Handling the end of a request

I was also able to remove two of these dependencies. Here's a key piece of code 
in **on-finished**, used by **finalhandler**:

```js
function onFinish (error) {
  eeMsg.cancel()
  eSocket.cancel()
  finished = true
  callback(error)
}

eeMsg = eeSocket = first([[msg, 'end', 'finish']], onFinish)
```

In **finalhandler**, I could reproduce `first()` with a simple promise that 
ends on the first triggered event:

```js
new Promise((resolve) => {
  function onFinished() {
    req.removeListener('end', onFinished)
    res.removeListener('finish', onFinished)
    res.removeListener('close', onFinished)
    write()
    resolve()
  }
  req.on('end', onFinished)
  res.on('finish', onFinished)
  res.on('close', onFinished)
})
```

## Handling routes

**connect** doesn't allow regexes for its routes. Instead, it relies on a 
carefully crafted string matcher and goes out of its way to ensure it's able
to understand and gracefully handle malformed requests.

Here's a snippet from **connect**'s `handle()`:

```js
var path = parseUrl(req).pathname || '/'
var route = layer.route
if (path.toLowerCase().substr(0, route.length) !== route.toLowerCase()) {
  return next(err)
}
var c = path.length > route.length && path[route.length]
if (c && c !== '/' && c !== '.') {
  return next(err)
}
if (route.length !== 0 && route !== '/') {
  removed = route
  req.url = protohost + req.url.substr(protohost.length + removed.length)
  if (!protohost && req.url[0] !== '/') {
    req.url = '/' + req.url
    slashAdded = true
  }
}
// call the layer handle
call(layer.handle, route, err, req, res, next);
```

That is only a small portion of it. By embracing regexes for matching routes,
I was able to reduce the entire `handle()` block to:

```js
async handle (req, res, out) {
  let index = 0
  const stack = this[metalStack]
  req.originalUrl = req.originalUrl || req.url
  const done = out || handler(req, res, { env, onerror })
  function next (err) {
    const { route, handle } = stack[index++] || {}
    if (!route) {
      return done(err)
    }
    // eslint-disable-next-line no-cond-assign
    if (req.match = route.exec(req.url)) {
      return call(handle, err, req, res, next)
    } else {
      return next()
    }
  }
  await next()
}
```

Note how subsequent handlers are given access to `req.match`, where all matched 
regex groups are available. If you try to use a string as a route, it's 
escaped and converted into `RegExp`, this way we don't have to make 
the distinction when matching routes.

This is a change that potentially affects **some** middleware code, but not all.
In **connect**, if you use `/foo` as a route, and a handler sees a request to 
`/foo/bar`, `req.url` will be simply `/bar`. In **@nuxt/metal**, `req.url` has 
no special treatment and is always what's sent over the wire, leaving it to 
middleware authors to parse it however they like.

# An upgrade path

The fact that **@nuxt/metal** is targeted at Node 10+, coupled with the change 
to `req.url`, requires us to be careful if we decide to replace **connect**
with **@nuxt/metal** in the Nuxt stack.

To ensure a graceful upgrade path, I've opened a [PR on nuxt.js][] which adds a 
`server.app` configuration option:

[]: https://github.com/nuxt/nuxt.js/pull/5605

```js
import Metal from '@nuxt/metal'

export default {
  server: {
    app: Metal.createServer()
  }
}
```

I also added the ability to pass a list of middleware, similar to [Nuxt's own 
`serverMiddleware`][], with the critical difference that you can be certain
these middleware will precede all Nuxt's internal middleware.

[]: https://nuxtjs.org/api/configuration-servermiddleware/

```js
import Metal from '@nuxt/metal'
import express from 'express'

export default {
  server: {
    app: Metal.createServer(
      express.json(),
      async (req, _, next) => {
        req.foobar = 1
        await next()
      },
      ['^/ping$'](req, res) {
        if (req.url === '/ping') {
          res.end('Pong')
        }
      },
      ['/echo/(.*)$'](req, res) {
        res.end(req.match[1])
      }
    )
  }
}
```

Note how routes are the names of the handlers themselves.

# Speed

- **@nuxt/metal**: 844k requests in 40.1s, 103 MB read
- **connect**: 814k requests in 40.1s, 99.3 MB read

**@nuxt/metal** seems slightly faster than **connect** in my local testing.
Although my benchmarking may be entirely wrong, the removal of some 
dependencies (and monkeypatches for Node 8.x) are likely the reason
why performance seems slightly improved.

# Availability

At this point, this is still highly experimental and I need to make sure
the switch to **@nuxt/metal** doesn't break any of Nuxt's tests. I also
need to persuade the sharp minds of the rest of Nuxt's core team in 
approving [the `server.app` PR][]. If all goes well, it could land in
Nuxt 2.6.4 via `server.app` and become the new default in Nuxt 3+.

[]: https://github.com/nuxt/nuxt.js/pull/5605

Regardless, I deemed this endeavor worthy of being recorded here.

⁂

When I started at [STORED e-commerce][] a little over two years ago, all their 
apps were still built with React. Around the same, Nuxt was nearing its 1.0 
release. After a very successful experimental Vue.js project, I convinced my 
boss to let us give Nuxt a go. For all the reasons nicely covered by [this Vue 
Mastery video][], Nuxt quickly proved itself to be the most productive web 
framework we had ever used. A big part of that comes from simply leveraging 
[Vue.js][], but Nuxt's choices of **sensible conventions** and **abstractions 
of common configurations** are what [made it a winner][] for us. Above all,

[]: http://stored.com.br
[]: https://www.youtube.com/watch?v=7ITypVi-qRY
[]: http://vuejs.org
[]: /2018/aug/12/the-thing-about-nuxt

> "Frameworks are not tools for organizing your code, they are tools for
> organizing your mind." — [Rich Harris][]

[]: https://svelte.dev/blog/svelte-3-rethinking-reactivity

Which resonates closely to Nuxt for me. Even if I weren't able to use Vue.js, 
I'd still want to structure whatever apps I write _the Nuxt way_.

I'm now a member of Nuxt's core team and have actively contributed to the 
project for some time. Nuxt already evolved into a mature ecosystem, with 
official and community provided modules for nearly everything you might need.