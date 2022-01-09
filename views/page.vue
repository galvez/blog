<template>
  <img class="cover" v-if="cover" :src="cover" />
  <main v-html="body" />
</template>

<script>
import { useSSRContext } from 'vue'
import { usePayload } from 'fastify-vite-vue/app'

export const path = '/:page'

export function getPayload ({ req, fastify }) {
	return fastify.blog.pages[req.params.page]
}

export default {
	setup () {
		return usePayload()
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
