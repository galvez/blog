<template>
  <main class="index">
    <template v-for="entry in videos">
      <a :href="entry.url" class="title">
        <span>{{ entry.title }}</span>
        <div />
         <p>{{ entry.excerpt }}<b></b></p>
        <span class="published">{{ entry.published }}</span>
      </a>
    </template>
  </main>
</template>

<script setup>
import { usePayload } from 'fastify-vite-vue/app'
const videos = [
  {
  	title: 'Introducing Blueprints for fastify-vite',
  	url: 'https://www.youtube.com/watch?v=IEgev8aC8AE',
  	published: 'November 5, 2021',
  	excerpt: 'A presentation on the hidden complexities of common SSR frameworks and how I approached solving some of them in a more transparent way with fastify-vite.',

	},
  {
  	title: 'Building a Full Stack Framework with Fastify',
  	url: 'https://www.youtube.com/watch?v=_wwNaJXJnNs',
  	published: 'November 5, 2021',
  	excerpt: 'A presentation on the hidden complexities of common SSR frameworks and how I approached solving some of them in a more transparent way with fastify-vite.',
	},
]
</script>

<script>
export const path = '/videos'
</script>

<style scoped>
.index {
  padding-top: 5em;
}
.title {
  display:  block;
  position: relative;
  font-weight: 900;
  padding:  0px;
  margin:  0px;
  margin-bottom: 1em;
  font-size: 2.3em;
  background: #fff;
  border: 4px solid #502374;
}
.title p {
  margin-bottom: 0.5em;
  font-weight: normal;
  font-style: italic;
  font-size: 0.6em;
  padding-left:  2em;
  padding-bottom: 1em;
  width: 90%;
}
.title span {
  display: block;
  padding-left: 0.5em;
  /*padding-bottom: 0.4em;*/
}
.title div {
  margin-top: -0.8em;
  background: #e0ff4f;
  height: 0.5em;
  width: 100%;
}
.title .published {
  font-size: 0.6em;
  font-style: italic;
  position: absolute;
  right: 0.4em;
  bottom: 0.1em;
}
</style>
