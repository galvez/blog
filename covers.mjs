import { readFile } from 'fs/promises'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import fp from 'fastify-plugin'
import convertSVGtoPNG from 'convert-svg-to-png'
import TemplateString from 'es6-template-string'

export default fp(async function (app) {
  const converter = convertSVGtoPNG.createConverter()
  const templatePath = resolve(dirname(fileURLToPath(import.meta.url)), 'assets', 'article.svg')
  const template = TemplateString.compile(await readFile(templatePath, 'utf8'))

  process.on('beforeExit', () => converter.destroy())

  app.get('/cover/*', async (req, reply) => {
    const entry = req.url.replace('/cover/', '').replace('.png', '')
    reply.type('image/png')
    reply.send(await converter.convert(template(app.blog.entries[entry])))
  })
})
