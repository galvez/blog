
import Markdown from '@nuxt/markdown'

const processor = new Markdown({
  toc: false,
  sanitize: false
})

export default async function convertToHTML (source) {
  source = transformMarkdownLinks(source)
    .replace(/⁂/g, '<p class="asterism">⁂</p>')
  const { html } = await processor.toMarkup(source)
  return html
    .replace(/nuxt-link/g, 'a')
    .replace(/to=/g, 'href=')
    .replace(/\s?data-press-link="true"/g, '')
}

// Goes through empty links and link references and numbers them
function transformMarkdownLinks (md) {
  const escapedRanges = collectRanges(/`[^`]+`/g, md)
  let linkIndex = 1
  let transformed = md.replace(/\n\[\]:/g, (match, index) => {
    if (!escapedRanges.find(r => r[0] <= index && index <= r[1])) {
      return `\n[${linkIndex++}]:`
    }
  })
  linkIndex = 1
  transformed = transformed.replace(/\]\[\]/g, (match, index) => {
    if (!escapedRanges.find(r => r[0] <= index && index <= r[1])) {
      return `][${linkIndex++}]`
    }
  })
  return transformed
}

// collectRanges returns index ranges for a given RegExp matches
function collectRanges (re, str) {
  const ranges = []
  let m = re.exec(str)
  while (m !== null) {
    ranges.push([m.index, m[0].length - 1])
    m = re.exec(str)
  }
  return ranges
}
