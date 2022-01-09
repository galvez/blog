<template>
  <main class="index">
    <template v-for="entry in featured">
      <a :href="entry.url" class="title">
        <span><em>♯</em> {{ entry.title }}</span>
        <div />
        <p>{{ entry.excerpt }}<b></b></p>
        <span class="published">{{ entry.published }}</span>
      </a>
    </template>
  </main>
</template>

<script setup>
import { usePayload } from 'fastify-vite-vue/app'
const { featured } = usePayload()
</script>

<script>
export const path = '/'
export const getPayload = ({ fastify: { blog } }) => blog
</script>

<style scoped>
.index {
  padding-top: 5em;
}
.title {
  color: #1e2021;
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
.title em {
  font-family: 'M+ 1m' !important;
  font-style: bold;
  font-weight: 300;
}
.title span {
  display: block;
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
