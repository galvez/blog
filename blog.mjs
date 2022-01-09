import Fastify from 'fastify'
import FastifyVite from 'fastify-vite'
import renderer from 'fastify-vite-vue'
import generate from './generate.mjs'
import store from './store.mjs'
import covers from './covers.mjs'

const root = import.meta.url
const app = Fastify({ ignoreTrailingSlash: true })

app.get('/favicon.ico', (_, reply) => {
  reply.code(204)
  reply.send()
})

await app.register(store, { root })
await app.register(covers)
await app.register(FastifyVite, { root, renderer, generate })
await app.vite.commands()
await app.listen(3000)

// TODO
// — Fix HEAD tags
// — Generate RSS Feed
