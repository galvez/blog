<template>
  <main v-html="entry.body" />
</template>

<script>
import { reactive } from 'vue'
import { useHead } from '@vueuse/head'
import { useRoute, usePayload, fetchPayload } from 'fastify-vite-vue/app'

export const path = '/:year/:month/:day/:title'

export function getPayload ({ req, fastify }) {
  return fastify.blog.entries[req.url.replace('/-/payload', '').slice(1)]
}

export default {
	setup () {
    const state = reactive({ entry: null })
    if (import.meta.hot) {
      const route = useRoute()
      import.meta.hot.on('store-update', async () => {
        state.entry = await fetchPayload(route)
      })
    }
    state.entry = usePayload()
    const imageName = `${state.entry.url.replace(/\//g, '-')}.png`
    useHead({
      meta: [
        { property: 'og:title', content: state.entry.title },
        { property: 'og:image', content: `https://hire.jonasgalvez.com.br/images/${imageName}` },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:creator', content: '@anothergalvez' },
        { name: 'twitter:image', content: `https://hire.jonasgalvez.com.br/images/${imageName}` },
      ]
    })
		return state
	}
}
// import hashCode from '~/lib/hash'

// export default {
  // props: ['data'],
  // head () {
  //   const entry = this.$press.source
  //   const image = `${config.blog.feed.link}/covers/${hashCode(entry.path)}.png`
  //   const meta = [
  //     { name: 'twitter:card', content: 'summary_large_image' },
  //     { property: 'og:type', content: 'article' },
  //     { property: 'og:url', content: `${config.blog.feed.link}${entry.path}` },
  //     { property: 'og:title', content: entry.title },
  //     { property: 'og:image', content: image }
  //   ]
  //   if (entry.meta) {
  //     meta.push(...meta)
  //   }
  //   if (entry.description) {
  //     meta.push(
  //       { property: 'og:description', content: entry.description }
  //     )
  //   }
  //   return {
  //     ...head,
  //     title: entry.title,
  //     meta: head.meta.concat(meta)
  //   }
  // }
// }
</script>
