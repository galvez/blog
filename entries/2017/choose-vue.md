---
date: June 23, 2017
---

# Why Choose Vue.js2

In the past five years or so, while the web development world was [going mad 
with the JavaScript revolution][] – I stayed mostly indifferent, occupying 
myself with backend work and distracting myself with things like [Kubernetes][].

In the rare occasions I needed to write JavaScript, I'd still just use jQuery or
its lightweight counterpart, [Zepto.js][], and ended up crafting a tiny custom
framework for every project. 

[]: https://hackernoon.com/how-it-feels-to-learn-javascript-in-2016-d3a717dd577f
[]: https://kubernetes.io
[]: http://zeptojs.com/

Ember and CoffeeScript were easy to ignore, as they were mostly contained within
the Ruby community. But then came Angular, React, Babel and recently Webpack – 
and substantial paid work. Turns out CoffeeScript would indeed not last, but the
community adherence to Babel (and ES6+) has been overwhelming.

My involvement with frontend work started peaking again a couple years ago, just
when Webpack-based builds were becoming the norm. Working as a consultant on
many different projects with different tools has given me a solid perspective on
each framework. Above all, it has given me the instinct to avoid complexity
whenever possible. Nowadays, I follow a simple rule when adding dependencies: if
the main application code is under 1000 lines, keep it in a single file. Or even
a separate file for HTML, CSS and JavaScript, but still, no further abstractions.
Most of the time, having fewer tabs to iterate over in my code editor makes me
more productive. Having a lot of different files that add up to a small piece
actually hurts productivity.

I have fully incorporated ES6 features that are natively supported by Chrome and
Firefox (such as `Array` functional methods and arrow functions) in my 
programming style, but will defer adding [Webpack][] to a project (that can
make [full use of ES2017+][]) by the same rule.

[]: https://webpack.github.io/
[]: https://babeljs.io/docs/plugins/preset-es2017/

Before I had the chance to try anything real with Polymer, [I was amazed by Vue
at its very first release][]. 

[]: http://blog.evanyou.me/2014/02/11/first-week-of-launching-an-oss-project/#comment-1270294920

The thing about Vue is that its minimalism makes
the API feel like a natural extension to HTML, much like a web standard.
While there's [a dozen articles comparing Vue to other frameworks][], here I
present the main characteristics that make me choose **Vue** over **React**.

[]: https://www.google.com.br/search?q=react+vs+vue

## No need to explictly bind methods

In React, you must explictly bind methods to `this` in the constructor or in
event handler assignments.

```js
class MyComponent extends React.Component {
  constructor (props) {
    super(props)
    this.myMethod = this.myMethod.bind(this)
  }
  myMethod () {
    console.log(this)
  }
}
```

You also need that `super(props)` if overriding `constructor`. Vue simplifies 
this by not using inheritance when defining components. Even when using fancy 
[single file components][], all you need to do is return an object with a 
`methods` dictionary:

[]: https://vuejs.org/v2/guide/single-file-components.html

```js
export default {
  methods: {
    myMethod () {
      console.log(this)
    }
  }
}
```

The irony is that there's [a whole segment][] in React's documentation on why 
composition is better than inheritance.

[]: https://facebook.github.io/react/docs/composition-vs-inheritance.html

## Easier state management and Vuex

In React, you need to use the `setState()` to trigger rendering updates as you 
modify the state. In Vue, you simply assign things to `this` and, if necessary,
the component's automatically rerendered. You do need to provide an initial 
state (`data`) for safety (and it will complain if you use undeclared properties).

```html
<template>
  <p>{{ message }}</p>
</template>

<script>
  export default {
    data: {
      message: null
    },
    mounted () {
      this.message = 'Something'
    }
  }
</script>
```

If state management needs evolve, [Vuex][] provides a clean implementation of
the same pattern seen in Flux and Redux. Instead of relying on multiple files 
like Redux, Vuex introduces store modules, that can divide handling of different
keys under the same unified state. The [store module API][] lets you specify 
`state`, `mutations`, `actions` and `getters` in a single object:

[]: https://vuex.vuejs.org/en/
[]: https://vuex.vuejs.org/en/modules.html

```js
const state = {
  currentModal: null
}

const getters = {
  currentModal: (state) => state.currentModal
}

const actions = {
  [action.OPEN_MODAL] ({commit}, modal) {
    commit(mutation.MODAL_OPENED, modal)
  }
}

const mutations = {
  [mutation.MODAL_OPENED] (state, modal) {
    state.currentModal = modal
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
```

## Mixins, watchers and computed properties

Vue is similar to React in the sense it uses the _props-down, events-up_ model.
You can define _props_ and _data_ (state) in a Vue component. But you can also 
very easily **watch** for changes in the state and [_preload_ components 
with properties from a _mixin_][]. So, following the earlier Vuex example for 
opening modals, we could have a `ui` mixin that listens to  `currentModal`:

[]: https://vuejs.org/v2/guide/mixins.html

```js
const ui = {
  computed: {
    ...<a href="https://vuex.vuejs.org/en/state.html">mapState</a>({
      currentModal: (state) => state.ui.currentModal
    })
  },
  watch: {
    currentModal (modal) {
      // code to open a modal
    }
  }
}

export default {
  mixins: [ui]
}
```

## Extremely flexible templating with no JSX

Despite the immense popularity of [JSX][], I find Vue's markup-based logic 
control to be simpler and easier to extend. Below is an example straight from 
React's [documentation][]:

[]: https://facebook.github.io/react/docs/introducing-jsx.html
[]: https://facebook.github.io/react/docs/jsx-in-depth.html

```js
function Item (props) {
  return <li>{props.message}</li>;
}

function TodoList () {
  const todos = ['finish doc', 'submit pr', 'nag dan to review']
  return (
    <ul>
      {todos.map((message) => <Item key={message} message={message} />)}
    </ul>
  )
}
```

JSX requires you to return and compose complete elements, and will force you to
use inline JavaScript to render collections (or an inline call to a function
that returns JSX). In Vue, you get declarative conditional rendering as a
natural extension of the markup (like Angular, without the boilerplate hell).

```html
<script>
  const Item = Vue.component('Item', {
    props: ['message'],
    template: '<li>{{message}}</li>'
  })
  export default {
    data: {todos: ['one', 'two', 'three']},
    components: {Item}
  }
</script>

<template>
  <ul>
    <Item v-for="todo in todos" :message="todo" />
  </ul>
</template>
```

## Vue.js and Web Components

Joe Gregorio's memorable [_No more JS frameworks_][] prompted me to keep an eye
on the development of [Web Components][]. 

When I looked at [Polymer][] it 
felt uncomfortably more verbose than React so I stuck with Vue. 

[]: https://bitworking.org/news/2014/05/zero_framework_manifesto
[]: https://www.webcomponents.org/
[]: https://www.polymer-project.org/

Nowdays however web components are natively supported by most browsers and [you 
can use Vue to build them][]. But perhaps an even bigger point to be made is 
that it's important to abstract away from frameworks and simply adhere to 
component-driven design. Just architect your application as a series of reusable
components and any half-decent framework will help you put it all together.

[]: https://vuejsdevelopers.com/2018/05/21/vue-js-web-component/
