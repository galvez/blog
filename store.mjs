import { readFile } from 'fs/promises'
import { parse as parsePath } from 'path'
import fp from 'fastify-plugin'
import FastifyWalk from 'fastify-walk'
import slugify from '@sindresorhus/slugify'
import matter from 'gray-matter'
import markdown from './markdown.mjs'

export default fp(async function (app, { root }) {
  const pathMap = {}
  const pages = {}
  const entries = {}
  const archive = {}
  const featured = []

  await app.register(FastifyWalk, { path: root, watch: true })

  if (process.argv.includes('drafts')) {
    app.walk.onFile('drafts/*.md', {
      found: addEntry,
      changed: path => addEntry({ path }, true)
    })
  }

  app.walk.onFile('entries/**/*.md', {
    found: addEntry,
    changed: path => addEntry({ path }, true)
  })

  app.walk.onFile('pages/**/*.md', {
    found: addPage,
    changed: path => addPage({ path }, true)
  })

  await app.walk.ready()

  app.decorate('blog', { entries, pages, featured, archive })

  const hotReloadPing = { type: 'custom', event: 'store-update' }

  async function addEntry ({ path: fileName }, update = false) {
    const source = await readFile(fileName, 'utf8')
    const parsed = parseEntry(source, fileName)
    if (parsed.hidden) {
      return
    }
    const title = extractTitle(parsed.content)
    const url = genURL(fileName, title, parsed.date)
    const entry = {
      url,
      title,
      featured: parsed.featured,
      date: parsed.date,
      published: parsed.published,
      excerpt: parsed.excerpt,
      id: genID(parsed.date, url),
      body: await markdown(extractBody(parsed.content))
    }
    if (update && pathMap[fileName]) {
      Object.assign(pathMap[fileName], entry)
    } else {
      entries[url] = entry
      pathMap[fileName] = entry
      addToArchive(entry)
    }
    if (update) {
      app.vite.devServer.ws.send(hotReloadPing)
    }
  }

  async function addPage ({ path: fileName }, update = false) {
    const source = await readFile(fileName, 'utf8')
    const parsed = matter(source, { excerpt: true })
    const page = {
      ...parsed.data,
      title: extractTitle(parsed.content),
      body: await markdown(extractBody(parsed.content)),
      url: parsePath(fileName).name
    }
    if (update && pathMap[fileName]) {
      Object.assign(pathMap[fileName], page)
    } else {
      pages[page.url] = page
      pathMap[fileName] = page
    }
    if (update) {
      app.vite.devServer.ws.send(hotReloadPing)
    }
  }

  function addToArchive (entry) {
    const year = entry.date.getFullYear()
    const month = (entry.date.getMonth() + 1)
      .toString()
      .padStart(2, '0')
    if (!archive[year]) {
      archive[year] = {}
    }
    if (!archive[year][month]) {
      archive[year][month] = []
    }
    archive[year][month].push(entry)
    if (entry.featured) {
      featured.push(entry)
      featured.splice(0, featured.length, ...sortByDate(featured))
    }
    archive[year][month] = sortByDate(archive[year][month])
  }
})

function sortByDate (entries) {
  return entries.sort((a, b) => (b.date - a.date))
}

function parseEntry (source, fileName, optional = false) {
  const entry = matter(source, { excerpt: true })
  Object.assign(entry, entry.data)
  entry.published = entry.date
  entry.date = new Date(Date.parse(entry.date))
  delete entry.data
  if (!optional && isNaN(entry.date)) {
    throw new Error(`${fileName} is not dated`)
  }
  return entry
}

function extractTitle (body) {
  const titleMatch = body.substr(body.indexOf('#')).match(/^#\s+(.*)/)
  return titleMatch ? titleMatch[1] : ''
}

function extractBody (source) {
  return source.substr(source.indexOf('#')).trim()
}

function genURL (fileName, title, date) {
  date = date.toString().split(/\s+/).slice(1, 4).reverse()
  const slug = slugify(title || fileName)
  return `${date[0]}/${date[2].toLowerCase()}/${date[1]}/${slug}`
}

function genID (date, path) {
  const tagDomain = 'hire.jonasgalvez.com.br'
  const year = date.getFullYear()
  return `tag:${tagDomain},${year}:${path}`
}
