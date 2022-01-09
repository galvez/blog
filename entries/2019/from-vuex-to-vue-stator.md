---
date: November 3, 2019
---

# From Vuex to VueStator

With Vue 3 [around the corner](https://github.com/vuejs/vue-next), it can seem 
frivolous to spend time writing a new state management library for Vue 2. 
[Vuex](https://vuex.vuejs.org/) gets the job done well and provides a good 
foundation for code organization.

I couldn't help but notice however that `Vue.observable()` became available in
Vue 2.6+, and that it can provide much simpler **_shared_ reactive state**.
Instead of relying on manually defined **_mutations_** to perform state updates,
an object proxied via `Vue.observable()` will react to property assignments and
Array changes just like you'd expect from `data()` in a Vue component, but we
can export it and use it throughout nested components without any issues.

After seeing [Filip Rakowski](https://twitter.com/filrakowski)'s awesome coverage
of [Vue 3's new features](https://vueschool.io/articles/vuejs-tutorials/exciting-new-features-in-vue-3/) I'm inclined to just abandon Vue 2 and migrate
to Vue 3 as soon as possible. But in reality, most of us will still be 
maintaining Vue 2 apps for a long time, and I see `Vue.observable()` as a way of
reducing the pain and excessive cruft of some large apps.

## Typical Vuex Nightmare

```js
import { SET_A, SET_B } from '~/constants'

export const mutations = {
  [SET_A] (state, a) {
    state.a = a
  },
  [SET_B] (state, b) {
    state.b = b
  }
}

export const actions = {
  doSomethingWithA ({ commit }) {
    // ... do something ...
    commit('SET_A', 'something')
  },
  doSomethingWithB ({ commit }) {
    // ... do something ...
    commit('SET_B', 'something')
  },
}
```

Most of the Vue apps I encountered to date use some variation of the pattern 
demonstrated above. In a small, isolated example like this it may not seem like 
much, but it's very easy to go from that to this:

```js
import {
  SET_A,
  SET_B,
  SET_C,
  SET_D,
  SET_E,
  SET_F,
  SET_G,
} from '~/constants'
```

And that's just the mutation constant imports.

When facing performance issues in an app that relied heavily on **Vuex** to do a
lot of cross-component updates, I decided to drop a few dozen mutations and 
give `Vue.observable()` a try.

To my surprise I found out that it had much better performance. I guess it was 
a combination of the Vuex bundle being removed and no longer initialized, and 
the removal of hundreds of LOC creating mutation functions that were refactored 
into simple assignments.

## Introducing VueStator

> `npm install vue-stator`

I still needed a way to organize my code around actions. I never liked deeply 
nested Vuex modules so I started **VueStator** with the goal of offering 
Vuex-like code organization but also with the contraint of allowing top-level 
modules only. The basic store registration function will make `$state`, 
`$actions` and `$getters` available globally. 

A simple example [from the README](https://github.com/galvez/vue-stator):

```js
Vue.use(VueStator, {
  state: () => ({
    auth: {
      user: null,
      loggedIn: false
    }
  }),
  actions: {
    auth: {
      login (ctx, state, user) {
        state.user = user
        state.loggedIn = false
      }
    }
  }
})
```

### Unified global state and virtual modules

Since I don't need mutations, that is, all my mutations are automatically 
registered in the form of `Object.defineProperty()` via `Vue.observable()`, all 
my code is now organized as actions. Still there are times an action will 
perform an asynchronous request and there are times an action will simply update
a bunch of state properties.

Notice how in the example above, `login()` takes three arguments? That's 
VueStator signature for actions. The first argument is the **global context**,
where you have access to all global injections (`$state`, `$actions` and 
`$getters`). The second argument is a convenience reference to the state key
that corresponds to the namespace in context. Revisiting the previous snippet:

```js
actions: {
  auth: {
    login (ctx, state, user) {
      state.user = user
      state.loggedIn = false
    }
  }
}
```

The second parameter, `state`, is a direct reference to `$state.auth`, while 
the global state remains accessible via `ctx.$state`. 

> Every top-level object in `$state` is considered to be a 
> **_virtual module_**, meaning you can group actions and getters under a 
> matching key and a reference to it will be automatically passed as second
> parameter to every action function.

This way, when I have actions that are simply doing a bunch of context state
updates, I can have a function defined as follows:

```js
namespace: {
  myAction (_, state, data) {
    // state = $state.namespace
    state.propA = data.propA
    state.propB = data.propB
  }
}
```

But if I'm doing an [axios](https://github.com/axios/axios) request, and am also 
updating other state properties, I could write a function like this:

```js
namespace: {
  async myAsyncAction ({ $axios, $state }, _, data) {
    // $state = global state
    // state = $state.namespace
    const response = await $axios.post(..., data)
    $state.someOtherNamespace.prop = response.data.prop
  }
}
```

Note how in both examples, I use `_` to indicate the parameter is not used. So
using this pattern, it's easy to recognize when I have mutation-like actions 
where nothing other than the contextual state key is accessed, and actions that 
actually do more than one thing.

### Refactoring nuxt/hackernews

To demonstrate how **VueStator** helps simplifying a Nuxt.js codebase, I've
refactored the [nuxt/hackernews](http://github.com/nuxt/hackernews) sample 
app to use it.

In [this commit](https://github.com/galvez/hackernews/commit/59ea67bb2caf9d764c85fac438dd60e9ebced809), you can see I upgrade it to 
**Nuxt 2.10**, so that I can very easily disable the default Vuex store and 
use the `store` directory safely, I add `vue-stator/nuxt` to `buildModules` 
and finally, move state out of `store/index.js` and into `store/state.js`.

> `vue-stator/nuxt` will automatically load `state.js`, `actions.js` and 
> `getters.js` files from the `store` dir (very much like Nuxt's automated Vuex 
> store). It will also load `actions.js` and `getters.js` under `store/<module>`,
> where `<module>` is a key matching a top-level object in `state.js`.
>
> Alternatively, it will consider `store/<module>.js` to be the same as 
> `store/<module>/actions.js` if only the file and not the directory is defined.


Then I 
[proceed](https://github.com/galvez/hackernews/commit/545f1e8bfe58527e8121b66beac37113039178b4) 
to moving actions onto `store/actions.js` following the updated
signature I described earlier, replace all occurrences of `$store.xyz` with
simply `$xyz` (`$state`, `$actions` and so on).

> For convenience, VueStator includes `mapState()`, `mapGetters()` and 
> `mapActions()`. But these are largely unnecessary if you adhere to accessing
> `$state`, `$actions` and `$getters` directly.

And finally all `$store.dispatch()` calls with direct calls via `$actions`:

```diff
- this.$store
-   .dispatch('FETCH_FEED', {
-     feed: this.feed,
-     page: this.page + 1,
-     prefetch: true
-   })
-   .catch(() => {})
+ this.$actions.fetchFeed({
+   feed: this.feed,
+   page: this.page + 1,
+   prefetch: true
+ })
```

To summarize:

- **Pros**: no more mutations, a clean idiom for calling actions and 
  more convenience injections that can be used in templates. Somewhat 
  improved speed (depending on store size and complexity).

- **Cons**: Vue.js devtools becomes useless for debugging your store, so you're
  left with manually inspecting it on the console. VueStator's `mapState()` might 
  not update reliably for deeply nested components, _but referencing `$state` 
  directly does_.

Huge thanks to [Pim](https://github.com/pimlie) 
for helping maintain this package.
