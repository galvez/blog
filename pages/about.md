---
layout: blog
cover: /images/desk.png
---

# About

<style>
.avatar {
  margin-top:  1em;
  display: inline-block !important;
  width: 100px !important;
  height: 100px !important;
  border-radius: 54px;
  border: 4px solid #502374 !important;
  margin-right: 2em;
}
</style>

<img src="/images/1.png" class="avatar">
<img src="/images/2.png" class="avatar">
<img src="/images/3.png" class="avatar">
<img src="/images/4.png" class="avatar">

When I was 14, I wrote [a book on Flash ActionScript](/images/book.png) programming, which kicked off my career in the most unusual of ways: with me convincing my parents to let me drop out of school, before I even finished 8th grade.

I abandoned Flash [before Apple killed it](https://www.youtube.com/watch?v=2qe-oNKIeUg), because I could already tell the future was in web standards. I wanted to learn what it took to develop traditional websites, with vanilla HTML screens backed by APIs and distributed databases. I wanted to learn how you could effectively deploy and scale them. Without any traditional education, the web was my university.

## Startup Life

That's when I got involved with Python, back in 2004. Thanks to my dad, who was an [ATC](https://en.wikipedia.org/wiki/Air_traffic_controller) for a couple of decades, and perhaps, binge watching **Friends** and **Senfield**, I knew just about enough English to get my first remote job as a full stack engineer. Before I could truly master the ways of Python backend development back then, powered by things like Apache and FastCGI, **Ruby on Rails** was going mainstream and the startup I worked for chose to adopt it.

I got involved deeply with [Ruby on Rails](https://rubyonrails.org/), so much that I still get job offers to work with it to this date. The premise of Rails was that developer time was more expensive than computer time, and companies would benefit from increased productivity delivering web applications. While that is actually true to some extent, it quickly became clear to me that was a slippery slope, with Rails services that truly handled millions of users becoming performance hogs, difficult to scale and keep running smoothly. <u>That of course didn't prevent all companies that used Rails from suceeding</u>, but I decided to go back to my Python origins.

When I got back to Python, it was quite a bit more mature, with things like [uWSGI](https://uwsgi-docs.readthedocs.io/en/latest/) ready to be leveraged. [Aaron Swartz](https://en.wikipedia.org/wiki/Aaron_Swartz) and [Mark Pilgrim](https://en.wikipedia.org/wiki/Mark_Pilgrim) were my main inspirations back then. Later, Flask's author, [Armin Ronacher
](https://en.wikipedia.org/wiki/Armin_Ronacher) also became a huge influence.

I miss the early 2000s blogsphere dearly — I like to think following folks like [Sam Ruby](https://en.wikipedia.org/wiki/Sam_Ruby), [Joe Gregorio](https://bitworking.org/), [Tim Bray](http://www.tbray.org/ongoing/) and [Mark Pilgrim](https://en.wikipedia.org/wiki/Mark_Pilgrim) gave me a bit of the software engineering education I missed from ditching school, that and hundreds of ebooks I could find.

## How I fell for JavaScript

When [Node.js](https://nodejs.org/) began to merge, I dove in and even participated in [Node Knockout](/2010/sep/05/node-knockout-lessons). But I was still too heavily involved with Python to see things clearly. And after over a decade as a Python engineer, I proceeded to learn [Go](https://golang.org) and still went on to use it professionally for some time.

It was only after I started dabbling with [Vue.js](https://vuejs.org) as a way out of [jQuery](https://jquery.com/) that things started to change. I considered myself pretty versed in CSS and jQuery at the time, but Vue.js was a [game changer](https://hire.jonasgalvez.com.br/2017/jun/23/why-choose-vuejs/). I managed to ignore Angular and React for a long time and stayed within my backend comfort zone, but Vue.js was just too interesting to pass up. I ended up taking on a few full stack engineering roles where I would code the backend in Go and the frontend in Vue.js.

Fast forward to 2017, I was introduced to React **server-side rendering** (**SSR**). Since I actually learned Vue.js before React.js, I felt the React.js development experience wasn't so great. And as soon as Vue.js started supporting SSR, I migrated back to it. The thing about SSR is that you get to write your whole application using a common language: JavaScript! Performance on the server obviously wasn't as good as Go, but Go couldn't SSR JavaScript effectively. 

## My time on the Nuxt.js core team

Getting SSR right and having a good developer experience was challenging — just dealing with isomorphic client code bundling and client-side hydration were enough to constitute a big learning curve to this _new way_ of developing applications. 

[Next.js](https://nextjs.org/) and [Nuxt.js](https://nuxtjs.org/) were created to address this and are currently the most popular SSR frameworks for React.js and Vue.js, respectively.

After working with Nuxt.js for nearly two years and started [contributing consistently](https://github.com/nuxt/nuxt.js/commits?author=galvez) to it, I was invited to be a member of its **core team**. [Many](/2018/aug/12/the-thing-about-nuxt/
) [pieces](/2019/apr/26/revamping-nuxts-http-server/) of [this](/2019/aug/19/the-story-of-nuxtpress) [blog](/2019/apr/27/nuxt-the-hard-parts/) are dedicated to it. Many of my public GitHub repositories [are Nuxt.js modules or experiments](https://github.com/galvez?tab=repositories&q=nuxt&type=&language=&sort=).

## Joining the Fastify team

Dealing with Nuxt.js performance issues led me to discover [Fastify](https://fastify.io), which I consider to be the state-of-the-art web framework for Node.js. I eventually <u>left the Nuxt.js core team</u> to pursue a Fastify-based solution for SSR: [fastify-vite](https://fastify-vite.dev).

I [joined the Fastify team](https://github.com/fastify/fastify/issues/3410) in late 2021 to lead an effort to eliminate the need for specialized SSR frameworks offering transparent and simple SSR primitives to Fastify instead. With fastify-vite's [renderer adapter API](https://fastify-vite.dev/concepts/renderer-adapters.html), you can SSR and provide backend capabilities to any frontend JavaScript framework (Vue.js, React.js etc) you want.

## My role at NearForm

I joined [NearForm](https://nearform.com) as an **Engineering Manager** on November 2021.

I'm focused now on becoming a <u>better mentor</u>, <u>standardizing and improving development practices</u> and anything that <u>facilitates the work of our teams</u>. 

Also, I'm part of the <u>developer relations</u> team and will continue doing <u>open source work</u> for the community. I'm blessed to be able to collaborate with [Matteo Collina](https://twitter.com/matteocollina) and others of the most brilliant and creative engineers I've ever met.

## Personal Life

I am 35 and live in the state of [São Paulo](https://www.google.com/maps/place/State+of+São+Paulo/@-22.4836602,-53.1323443,6z/) in Brazil (UTC-3) with my wife and our three cats. I work **100% remotely** from a homely little town.

I very much still consider myself a workaholic, often unable to spend much time away from the screen, something I'm actively trying to change now. 

[Burnout Paradise](https://en.wikipedia.org/wiki/Burnout_Paradise), the [Uncharted series](https://en.wikipedia.org/wiki/Uncharted) and [Horizon Zero Dawn](https://en.wikipedia.org/wiki/Horizon_Zero_Dawn) are my favorite videogames. I also like to play pool and have been managing to spend a ridiculous amount of time the pool hall — as long as it's time offline, it's a win. 

[IMDb says I've seen 789 titles](https://www.imdb.com/user/ur4323708/ratings), but it's probably missing a few. I watch way too many movies and TV shows, sometimes several in parallel, in 5-minute chunks. I'm trying to cut down on this habit, as there'll never be enough time in the world to watch everything's potentially worth watching, so I've decided to just give up and further spend more time living my own life.

I am driven by <a href="https://www.facebook.com/thedannyroddyweblog/photos/a.1222130331142621.1073741829.160367813985550/1215862991769355/?type=3">purpose</a> and cultivate a <a href="https://en.wikipedia.org/wiki/Meditations">stoic attitude</a> towards life.
