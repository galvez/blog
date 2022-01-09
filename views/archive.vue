<template>
  <main>
    <section v-for="year in Object.keys(archive).reverse()">
      <h1>{{ year }}</h1>
      <template v-for="month in Object.keys(archive[year]).sort().reverse()">
        <template v-for="entry in archive[year][month]">
          <a class="title" :href="entry.url"><span><em>♯</em> {{ entry.title }}</span></a>
        </template>
      </template>
    </section>
  </main>
</template>

<script>
import { usePayload } from 'fastify-vite-vue/app'

export const path = '/archive'

export function getPayload ({ fastify: { blog } }) {
  return { archive: blog.archive }
}

export default {
  setup () {
    return usePayload()
  }
}
</script>


<style scoped>
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
