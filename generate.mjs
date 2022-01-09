import { existsSync } from 'fs'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export default {
  paths (app, add) {
    add('/')
    add('/about')
    add('/archive')
    add('/videos')
    add('/influences')
    for (const entry of Object.keys(app.blog.entries)) {
      add(`/${entry}`)
    }
  },
  async done (app) {
    const imagesDir = join(app.vite.options.root, 'public', 'images')
    for (const url of Object.keys(app.blog.entries)) {
      const imageName = `${url.replace(/\//g, '-')}.png`
      if (!existsSync(join(imagesDir, imageName))) {
        const response = await app.inject({ url: `/cover/${url}.png` })
        await writeFile(join(imagesDir, imageName), response.rawPayload)
        console.log(`ℹ generated /images/${imageName}`)
      }
    }
  }
}
