---
date: April 27, 2019
featured: true
---
Learn some of Nuxt's advanced features by implementing a simple authentication system with server middleware, cookies and JWT.
---

# Nuxt: The Hard Parts

In this article I'll explore one of the main sources of confusion and 
help requests in the [Nuxt][] community: the [**@nuxtjs/auth**][] module. The
reason this module causes so much confusion is that it requires users to
understand a few core concepts of Nuxt that are often ignored by new
developers eager to get something working quickly. I realized these concepts
constitute what one might call the **hard parts** of Nuxt.

[]: http://nuxtjs.org
[]: https://auth.nuxtjs.org/

First I'll dive into the features that allow the **@nuxtjs/auth** module to
work, as a way to explore Nuxt's advanced features. Then I'll demonstrate how 
to build a simple auth system. 

That being said, I won't discuss the particulars of any authentication scheme,
I'm assuming you already know that. 

Instead, this article focuses on the tools and the confusion surrounding the 
tools Nuxt offers to **effectively use and implement APIs**, and also 
**control routing**.

## Vuex recap

First off, you need to [understand Vuex][]. The linked article by Flavio Copes
is a great introduction, but, in a nutshell:

[]: https://flaviocopes.com/vuex/

- You declare all of your application data as a state object. By predefining all
  of the state's structure (including empty properties as `null`), the Vuex 
  engine can **track and react to changes to them**. A basic state within 
  `store/index.js` might look like this:

```js
export const state = () => ({
  user: {
    authenticated: false,
    id: null
  }
})
```

- You create mutations (which are just a set of functions) to actually perform 
  state changes, i.e., you can only assign new values to state properties 
  **inside a mutation handler**. 

```js
export const mutations = {
  authUser(state, user) {
    state.user.id = user.id
    state.user.authenticated = true
  }
}
```

- With that, the following becomes available in Vue.js components:

```js
this.$store.commit('authUser', { id: 123 })
```

- To alter the state, you don't actually need [**actions**][]. Most of time
  you'll find yourself doing random `$store.commit()` calls to update your
  application state. Mutations however don't allow you to run asynchronous
  code while performing state changes. For that you can use an **action**,
  which also allows you to call multiple other mutations. Note that you 
  **can't** directly assign new data to state via an action other than by 
  calling a mutation. **Protip**: use [unholy][] to turn `$store.commit()` into
  a generic recursive merge function.

[]: https://vuex.vuejs.org/guide/actions.html
[]: https://github.com/galvez/unholy

- Once a mutation is executed, any piece of a Vue  template tied to the changed 
  properties (via `mapState`) is automatically updated.

```html
<template>
  <div class="auth-menu">
    <span
      v-if="user.authenticated">
      Logged in
    </span>
    <a
      v-else
      href="/login">
      Login
    </a>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  computed: mapState(['user'])
}
</script>
```

In Nuxt, simply creating a file at `store/index.js` is enough for `$store` to 
be injected in your Vue application. The fact that Nuxt relies so heavily on the
filesystem to determine aspects of the application can be confusing at first, 
but extremely convenient in practice.

## SPA vs SSR confusion

Nuxt is a hybrid Vue.js framework. It lets you build both a regular Vue.js SPA
(Single Page Application), that renders solely on the browser, and a 
**server-side (pre)rendered** (SSR) Vue.js SPA. This is still not fully 
understood by a lot of people, perhaps due to the SSR _misnomer_. 
Applications are 
still actively _rendered_ on the client via the Vue engine. That means 
`$router.push()` on the client side won't trigger any network calls, as 
expected. But if you access a `/route` directly, the **first time it comes back 
from the server** it'll come prerendered, ready for display. It's important to 
fully understand this basic concept in order to grasp all associated aspects.

## Nuxt modules vs plugins confusion

It's useful to understand how Nuxt modules work, so you know what's going on or
at least where to look for things. Nuxt modules are just functions that add 
more code to your Vue.js app. By understanding how they're used, you can even 
easily dismember and adapt them into your own code if you ever need to heavily 
customize something.

Nuxt is a runtime with a built-in compiler. What it does is take your code, 
load it and wrap it within a [predefined Vue.js app][], with all heavy 
lifting done for you. 

Nuxt will create a VueRouter instance, a Vuex store, Webpack configuration
etc, so you can focus on your Vue application code.

[]: https://github.com/nuxt/nuxt.js/tree/dev/packages/vue-app

The [Nuxt Module API][] provides hooks that let you run code before or after 
the actual build, among others. 

It also provides functions to **add new code** 
to the final compiled Vue.js app, such as `addTemplate()` and `addPlugin()`.

[]: https://nuxtjs.org/api/internals/

Plugins are just code Nuxt runs [on top of your entire application][]. You use
plugins to add extensions to your Nuxt app, such as Vue.js plugins. To enable
a plugin, add it to the [`plugins` configuration property][] in
`nuxt.config.js`. Plugins can run on the server, client or both. Use the 
`.client.js` and `.server.js` suffixes or none to indicate both.

[]: https://nuxtjs.org/guide/plugins/
[]: https://nuxtjs.org/api/configuration-plugins/

If you look into **@nuxtjs/auth**'s' [source code][], you'll see a `addPlugin()`
call in [`lib/module/index.js`][] to add [`auth/plugin.js`][] to your Nuxt app. 
It will cause that code to run both on the server for every request (before SSR)
and also on the client during initialization.

[]: https://github.com/nuxt-community/auth-module/tree/dev/lib
[]: https://github.com/nuxt-community/auth-module/blob/dev/lib/module/index.js
[]: https://github.com/nuxt-community/auth-module/blob/dev/lib/module/plugin.js

## Middleware confusion

Plugins are a way to run code on top of your application, and even access the
Vuex store, as used by [**@nuxtjs/http**][] for [defining request and 
response interceptors][], but you can't make _routing decisions_ with plugins. 
For that you need a router middleware. A [router middleware][] is a magic piece
of functionality in Nuxt, because it will work locally for navigation but will
also run on the server for first requests.

[]: https://http.nuxtjs.org/
[]: https://http.nuxtjs.org/guide/advanced.html#hooks
[]: https://nuxtjs.org/guide/routing#middleware

Think of it as a streamlined version of [VueRouter's navigation guards][]. With
Nuxt, you can simply set the `router.middleware` property in `nuxt.config.js` for 
global navigation guards, or use the `middleware` property in individual Nuxt
pages or layouts.

[]: https://router.vuejs.org/guide/advanced/navigation-guards.html

Nuxt will store all files you place under `middleware/` in an internal object,
so middleware can be accessed and defined by a key. The default application 
Nuxt generates will include a `middleware.js` file in its final code, where
that object is exported. That is also a way for new route middleware to be 
added to a project by a module.

The **@nuxtjs/auth** module does exactly this: it'll add a middleware function
named `auth` to the object exported by `middleware.js` (the file that is 
automatically generated by Nuxt). That's why there's a seemingly cryptic 
`middleware.js` import on [line 3 of `lib/module/index.js`][]. When the plugin
added by **@nuxtjs/auth** runs, it'll also make the `auth` middleware available
for you to enable globally or directly on pages and layouts.

[]: https://github.com/nuxt-community/auth-module/blob/dev/lib/module/plugin.js#L3

Nuxt has an entirely different type of middleware: `serverMiddleware`. This is
an array where you can list functions that are treated as [**connect**][] 
middleware. The **@nuxtjs/auth** module adds one such `serverMiddleware` in
its [oauth provider][].

Nuxt `serverMiddleware` are ran serially, **only on the server**.

[]: /2019/apr/26/revamping-nuxts-http-server
[]: https://github.com/nuxt-community/auth-module/blob/dev/lib/providers/_utils.js#L29

Knowing how a module works, what operations it can perform in your project code,
and also, how plugins and router middleware differ, should be enough to get you
on a path of debugging any problems with the **@nuxtjs/auth** module. The code
for the `Auth` class, which is instantiated and injected in your Nuxt app as 
`$auth`, is [rather sophisticated][], but that sophiscation allows you to reuse
multiple [authentication providers][] with ease.

[]: https://github.com/nuxt-community/auth-module/blob/dev/lib/core/auth.js
[]: https://github.com/nuxt-community/auth-module/tree/dev/lib/providers

⁂

## Build your own

The **@nuxtjs/auth** module is great and likely the best choice if you need 
to support multiple authentication methods the fastest way possible. But once
you become familiar with Nuxt you'll probably also consider rolling out 
everything your own way to meet other requirements. I've created a [simple 
boilerplate][] to help you get started. I call it **quickjam**, where **jam** 
refers to the new [JavaScript, APIs and Markup][] proposed acronym.

[]: https://github.com/galvez/quickjam
[]: https://jamstack.org

See it here: [https://github.com/galvez/quickjam][]

[]: https://github.com/galvez/quickjam

You can use [`serverMiddleware`][] to add an API on top of your Nuxt.js API. 
That means all requests will reach the same server, but you can make requests 
that start with `/api/` land in a special request handler, whereas all other 
requests will reach the Nuxt internal middleware as usual. This is far from an 
ideal architecture, as with this you effectively have two different applications
running with the same process, which makes it harder to isolate and scale 
separately. If scalability is not an immediate concern, it has shown to work
surprisingly well in a number of projects with a properly load balanced pool 
of Nuxt server processes (usually behind **nginx**).

[]: https://nuxtjs.org/api/configuration-servermiddleware/

[This commit][] adds a minimal Nuxt boilerplate: `package.json`, 
`nuxt.config.js`, `middleware/auth.js`, `store/index.js`, `api.js` and 
[eslint][] configuration. Yes, it is unfortunate that I need to add that many
packages to `devDependencies` in order for this to work. Hopefully this will
get better once [eslint-plugin-nuxt][] is finalized.

[]: https://github.com/galvez/quickjam/commit/7e7ad828e5c027bbe15b987682adf4cbada4b602
[]: https://eslint.org/
[]: https://github.com/nuxt/eslint-plugin-nuxt

> While we're on the topic of `eslint`, [this eslint-plugin-vue rule][] is 
> incredibly annoying. To me it's a matter of personal preference: running 
> `eslint --fix` with this rule produced code just flat out bizarre to me 
> so I've disabled it with [this commit][].
 
[]: https://github.com/vuejs/eslint-plugin-vue/blob/master/docs/rules/html-closing-bracket-newline.md
[]: https://github.com/galvez/quickjam/commit/099385550dc461b344b5d0e6c2812fea317aa906

Notice how I import `api.js` as `serverMiddleware` in `nuxt.config.js` so I can
easily add it to the Nuxt configuration object. The `api.js` file exports an 
Array, where we'll add some server API functions next.

> **Please be aware that this boilerplate has practically zero error handling**.
> It's merely a didactic example of how to use APIs, server middleware and routing
> middleware in Nuxt. Make sure you plug all the holes if adapting it into a 
> real app.

## The @nuxt/http module

But first, let's make sure our Nuxt app can actually perform API requests. For
a long time that would have been a job for [**@nuxtjs/axios**][] module, which 
provides an integrated [**axios**][] instance. Now, **@nuxtjs/axios** can be 
replaced by an improved alternative: the [**@nuxt/http**][] module, which
relies on [**ky**][] instead of **axios**. It has a slightly different API but 
significantly lower bundle size.

Here's the updated **nuxt.config.js**:

[]: https://axios.nuxtjs.org/
[]: https://github.com/axios/axios
[]: https://http.nuxtjs.org
[]: https://github.com/sindresorhus/ky-universal

```js
import serverMiddleware from './api'

export default {
  serverMiddleware,
  modules: ['@nuxt/http'],
  server: {
    port: 3000
  },
  http: {
    baseURL: 'http://localhost:3000'
  }
}
```

Since the API's base URL will be the same as the Nuxt's app, setting `baseURL`
isn't really necessary, but in practice you'll want to explicitly set it in
order to be able to set it with an environment variable in the future. Same 
goes for Nuxt's default server port, which is `3000`.

To help you get a taste of the **@nuxt/http** module, I added a simple 
server middleware function for `/api/ping` which returns a _timestamped pong_.
You can see it all in [this commit][].

[]: https://github.com/galvez/quickjam/commit/c2b55c829ef6cd07bc2a4896ac97db8c825c4783

```
export default [
  {
    path: '/api/ping',
    handler(req, res, next) {
      res.end(`API pong at ${new Date().getTime()}`)
    }
  }
]
```

The `asyncData()` method in `index.vue` will make a HTTP request no matter how
the page is accessed (locally via `$router.push()` or a first request to the 
server). In the case of a first request, the HTTP request **will be performed 
seamlessly server-side**.

```js
async asyncData({ app }) {
  const response = await app.$http.get('api/ping')
  return {
    pongMessage: await response.text()
  }
},
mounted() {
  alert(this.pongMessage)
}
```

## JSON support

Now that we can make and receive API requests, let's add [JSON support][] to
the **server middleware**. **@nuxt/http** already has JSON support for making 
requests and parsing responses, so we need to add support on the API now. For
this I use [**body-parser**][]. 

[]: https://github.com/galvez/quickjam/commit/66e4ee75359360f1182f7424d6e6754fbcbf97cd
[]: https://github.com/expressjs/body-parser

```js
import { json } from 'body-parser'

export default [
  ...
  json(),
  (req, req, next) => {
    res.json = (obj) => res.write(JSON.stringify(obj))
    next()
  }
]
```

That `json()` call will return a working middleware function that peeks into 
requests, detects and parses JSON payloads, automatically making them available 
as `req.body`. I also added a little `res.json()` helper to quickly dump 
JSON responses. 

Of course, we're still looking at the `api.js` file. The first middleware 
function is the `/api/ping` handler I've added earlier, hidden above for 
brevity. Note how in the second handler, `next()` is called at the end. 

This is **key** to understanding server middleware handlers. If you don't call 
`next()`, no subsequent middleware will be executed and the response is finished 
and sent to the user. Calling `next()` is what lets us run multiple middleware 
serially until we get to Nuxt SSR phase.

## Password hashing

Moving on with the boilerplate, let's redirect unauthenticated users to 
`/login` and also add a `/register` page. To register users, we'll use a mocked
database. In [this commit][] you'll see a `db.js` file as follows:

[]: https://github.com/galvez/quickjam/commit/e51e31849fc358a5f20c6afa6bec8c1850bf6e6d

```js
import bcrypt from 'bcrypt'

function hashPassword(password) {
  const salt = bcrypt.genSaltSync()
  return new Promise((resolve) => {
    bcrypt.hash(password, salt, (err, hash) => {
      resolve(err ? null : hash)
    })
  })
}

const db = {
  users: {}
}

export async function addUser(user) {
  user.password = await hashPassword(user.password)
  db.users[user.email] = user
}
```

That file is imported by `api.js` and used to handle `POST /api/users`:

```js
{
  path: '/api/users',
  async handler(req, res, next) {
    if (req.method === 'POST') {
      await addUser(req.body)
      res.json({ success: true })
      res.end()
    }
    res.writeHead(403, 'Forbidden')
    res.end()
  }
}
```

Also in the [same commit][], you'll see I added the user state in 
`store/index.js`, proper login and register pages, with the register page 
already making an HTTP call to add a new user and redirect back to `/login`. 
You'll also notice an addition to the `auth` middleware:

[]: https://github.com/galvez/quickjam/commit/e51e31849fc358a5f20c6afa6bec8c1850bf6e6d

```js
export default function ({ store, route, redirect }) {
  if (!store.state.user.authenticated) {
    redirect('/register')
  }
}
```

## JWT login

So far we can only get users registered (in our extremely volatile mock 
database), but none of them can still actually login. First there must be an 
`/api/login` endpoint which returns a JWT token, and code on the client-side
to store it in a cookie so it will be sent automatically by the browser for
every subsequent request. [This commit][] adds the server code to generate JWT 
tokens and client code to store them. You'll see in that commit some markup
fixes as well, among minor other changes. For authenticating users, `db.js` 
now exports `authUser()`:

[]: https://github.com/galvez/quickjam/commit/379eaaafb247377b43e215674bcc3df15dc9ea74

```js
function checkPassword(password, user) {
  return new Promise((resolve) => {
    bcrypt.compare(password, user.password, (err, result) => {
      resolve(err ? false : result)
    })
  })
}

export function authUser(email, password) {
  if (email in db.users && db.users[email]) {
    return checkPassword(password, db.users[email])
  }
  return false
}
```

That is imported by `api.js` and used by the `POST /api/login` handler:

```js
{
  path: '/api/login',
  async handler(req, res, next) {
    if (req.method === 'POST' && await authUser(req.body)) {
      const payload = { email: req.body.email }
      const token = sign(payload, sessionSecret, { expiresIn })
      res.json({ token })
      res.end()
      return
    }
    res.writeHead(403, 'Forbidden')
    res.end()
  }
}
```

Here's what our submit handler in `/login` looks like:

```js
<template>
  <div>
    <h2>Login</h2>
    <input
      placeholder="Email"
      v-model="form.email">
    <input
      placeholder="Password"
      v-model="form.password">
    <button @click="login">
      Login
    </button>
  </div>
</template>

<script>
export default {
  data: () => ({
    form: {}
  }),
  methods: {
    async login() {
      const response = await
        this.$http.$post('api/login', this.form)
      if (response.token) {
        this.$store.commit('authUser', {
          email: this.form.email,
          token: response.token
        })
      }
      this.$router.push('/')
    }
  }
}
</script>
```

## Retrieving cookies

So far, [**quickjam**][] is able to register and login new users to its mock,
in-memory database, but as soon you close the browser tab, you're logged out.
There's no **session persistence**. We must store a cookie after login so that 
we can retrieve it in subsequent server requests.

[]: https://github.com/galvez/quickjam

I used the [cookie][] (server) and [js-cookie][] (client) libraries for this.
There's probably a way to use the same library both on the client and server,
but since docs on these are somewhat confusing, I'll stick to using both for 
now. Do [let me know][] if you have a better approach.

[]: https://github.com/jshttp/cookie
[]: https://github.com/js-cookie/js-cookie
[]: https://github.com/galvez/quickjam/pulls

In [this commit][], you'll see the addition of a new server middleware:

[]: http://...

```js
(req, res, next) => {
  const cookies = req.headers.cookie || ''
  const parsedCookies = parse(cookies) || {}
  const token = parsedCookies['quickjam-auth-token']
  if (token) {
    const jwtData = verify(token, sessionSecret)
    if (jwtData) {
      req.email = jwtData.email
      req.token = token
      return next()
    }
  }
  next()
}
```

Now, for every request, we check if there's a `quickjam-auth-token` cookie,
and if that is a valid JWT token. 

If it is, we store both `email` and `token` in the `req` object so we can pick 
them up further into in the Nuxt stack. We don't actually need to store 
`req.token` for this part, as we're able to authenticate the user in Nuxt 
middleware based on the presence of `req.email` alone, but having the token 
stored in the state **will** be necessary when we proceed to the next step, 
which is securing API requests.

To authenticate based on `req.email`, you can add the following bit to the 
`auth` middleware. Note how `process.server` is used to make sure a specific 
piece of code is only ran on the server. A more elegant way to achieve the 
same result is by using the [nuxtServerInit action][].

```js
if (process.server && req.email) {
  store.commit('authUser', {
    token: req.token,
    email: req.email
  })
}
```

[]: https://nuxtjs.org/guide/vuex-store/#the-nuxtserverinit-action

## API authentication

At this point, we're able to register and login users, and also identify
logged in users via a cookie. But we can't use a cookie to secure API requests
because at some point, you're gonna have to run server-side API requests 
during login, and cookies aren't relayed from the browser to API during a
server-side request, unless you manually do so. It is far more effective to 
employ an alternate authentication strategy, specific to API requests, that 
relies on the `Authorization` HTTP header rather than cookies.

To add an `Authorization` header to API requests, we can use [@nuxt/http
hooks][]. The next and [final commit][] adds an http plugin to hook into API
requests and make sure they go out with the JWT token:

[]: https://http.nuxtjs.org/guide/advanced.html#hooks
[]: https://github.com/galvez/quickjam/commit/fc5404272c6accdf8b6f5c1d00d2e51b3593c6dc

```js
export default function ({ $http, store }) {
  $http.onRequest((config) => {
    if (store.state.user.authenticated) {
      const auth = `Bearer ${store.state.user.token}`
      config.headers.set('Authorization', auth)
    }
    return config
  })
}
```

> **@nuxt/http** offers slightly different API than **@nuxtjs/axios** for this,
> instead of simply assigning new keys to `config.headers`, you just use the
> `set()` method instead.

To check for the Authorization header server-side on API requests, I've added
yet another server middleware which looks like this:

```js
(req, res, next) => {
  if (!req.url.startsWith('/api')) {
    return next()
  }
  if (!req.headers.authorization) {
    res.statusCode = 401
    res.end()
    return
  }
  const tokenMatch = req.headers.authorization.match(/Bearer (.+)/)
  if (tokenMatch) {
    const jwtData = verify(tokenMatch[1], sessionSecret)
    if (jwtData) {
      req.email = jwtData.email
      req.token = tokenMatch[1]
      return next()
    }
  }
  res.statusCode = 401
  res.end()
}
```

The same commit also adds the `GET /api/user` API method, which will return all
user data (including name). In `index.vue`, we now see:

```js
export default {
  middleware: 'auth',
  data: () => ({
    user: {}
  }),
  async asyncData({ $http, store }) {
    return $http.$get('api/user')
  }
}
```

## Conclusion

Make no mistake, you might very well find some holes in this setup. It is,
like I mentioned earlier, meant to be a didactic example of how to effectively
use and share data between server and routing middleware. In that regard I
believe it succeeds in getting you started with a clear picture of all moving
parts. Also, don't forget this uses an in-memory mock database, so every time
your server restarts, `db.users` is reset. You'll want to refactor `db.js` to
include code that talks to a real database server.

Also keep in mind this is far from an ideal setup. For better scability, you'll
want to have your API separate from your Nuxt app. But like I said, this setup
will actually go a long way for most apps, and is an extremely convenient
and productive way to get your MVP started.

Soon there'll be [an entirely different stack][] for getting backend API 
services  bundled in a Nuxt app, so keep an eye on that!

[]: https://github.com/nuxt/nuxt-services-experimental

## Other resources

- [Alexander Lichter: My take on using Nuxt with an API][]
- [Krutie Patel: Universal application code structure in Nuxt.js][]
- [Erik Hanchett: Learn Server Middleware with Nuxt.js][]

[]: https://blog.lichter.io/posts/my-take-on-using-nuxt-with-an-api
[]: https://medium.freecodecamp.org/universal-application-code-structure-in-nuxt-js-4cd014cc0baa
[]: https://www.youtube.com/watch?v=j-3RwvWZoaU
