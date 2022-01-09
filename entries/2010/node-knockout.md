---
date: September 5, 2010
---

# Node Knockout Lessons

I participated in the [Node Knockout][] together with [Rafael Valverde][] and 
[Claus Wahlers][], and it was buckets of fun. We originally intended to do an 
application that involved taking page screenshots, but we were still facing 
problems getting it to run after a day into the competition, so we started over 
with a different idea and ended up delivering a functional application a few 
hours past the deadline, but it was still worth the experience.

[]: https://web.archive.org/web/20101205010615/http://nodeknockout.com/
[]: http://twitter.com/rafacv
[]: https://twitter.com/cwahlers

[NodeVote][] is a simple real-time, anonymous, voting room application. Like 
many people, we used [Express.js][], which is built on top of [Connect][] (WSGI
for Node.js). But in reality, the web framework was a last-minute decision and 
we went along with what seemed the most approachable. Express.js is very 
[Flask][] and [Sinatra][]-like, which was instantly welcoming. We also looked 
at [Nitrode][], but that looks like an attempt to provide a wider set of HTTP 
features (especially caching), and I'm not convinced that would be better than 
just using nginx and having it forward certain requests to Node.js backends.

[]: https://github.com/nko/the-node-kushes
[]: http://expressjs.com/
[]: http://github.com/senchalabs/connect
[]: http://flask.pocoo.org/
[]: http://sinatrarb.com/
[]: http://github.com/ollym/nitrode

We also used [EJS][] for HTML templating, [Socket.IO][] as the WebSocket server 
and [commonjs-utils][] for JSON serialization. All in all, Node.js is incredibly
fun to write applications with, simply because it's JavaScript. JavaScript is a 
very dynamic and fluid language. Code _flows_ pretty elegantly with it, 
especially with anonymous function passing.

[]: http://github.com/visionmedia/ejs
[]: http://github.com/LearnBoost/Socket.IO-node
[]: http://github.com/kriszyp/commonjs-utils

What is clear from this experience is that Node.js is here to stay. 
[Ryan Dahl][] is doing an excellent job evolving the project, which has [very 
easy to follow documentation][] and a rapidly growing community. I'd encourage 
you to go and watch [Ryah Dahl's Google Tech Talk on Node.js][]. It goes into 
great detail explaining why Node.js as an application server option is 
conceptually sane, and well, surprisingly fast too. He also starts the video 
with a great piece of advice, with pretty much sums up my feelings towards web 
application development these days (paraphrased, emphasis mine):

[]: http://tinyclouds.org/
[]: http://nodejs.org/
[]: http://www.youtube.com/watch?v=F6k8lTrAE2g

> "There's a lot of different ways to write servers, especially for high-level 
> languages, and everybody kind of employs their own flavor of how to abstract 
> this problem of dealing with possibly thousands of different people connecting
> to your server at a time. And I think **we need to be careful how we make 
> these abstractions**. **The problem is that at some point you might have to 
> use those and you just might feel trapped by them**."

Rails, for instance, is a great example of one big set of abstractions that 
kept growing too big. Granted, it abstracts applications on top of a [well 
defined architecture][], but what I myself and I believe many other people 
realized after a while is that you don't need MVC all the time. Rails already
[allows you to use raw Rack HTTP handlers][], and it's usually recommended
that you do so for high-traffic resources. But what I believe, in fact, is 
that you can use these minimalistic HTTP handlers to build even the largest
applications, while also experiencing greater ease in managing and evolving 
the code in the long run.

[]: http://en.wikipedia.org/wiki/Model%E2%80%93View%E2%80%93Controller
[]: http://weblog.rubyonrails.org/2008/12/17/introducing-rails-metal

The more you understand the underlying protocols, and I mean everything from BSD
sockets to HTTP, the less you'll want your frameworks to abstract away from you.
You'll know how to choose what to use and not to use from them, and I think the
idea here is that as long as your framework limits itself to simply exposing
these underlying protocols you're using in efficient language constructs, you'll
end up with incredibly succint and powerful application code.

I think that is what [Node.js][] is about and that's why it's here to stay.

[]: http://nodejs.org/
