<template>
	<div class="wrapper">
		<div class="content" :class="{entry: !isIndex}">
			<a class="go-back" v-if="!isIndex" href="/">Index <span>↩</span></a>
			<router-view v-slot="{ Component }">
			  <Suspense @resolve="hydrationDone">
		    	<component :key="$route.path" :is="Component" />
			  </Suspense>
			</router-view>
	  </div>
	  <About v-if="isIndex" />
	</div>
</template>

<script setup>
import '/assets/fonts.css'
import '/index.scss'
import '/styles/prism.css'
import About from '/parts/about.vue'
import { useRoute } from 'vue-router'
import { hydrationDone } from 'fastify-vite-vue/app'
const isIndex = useRoute().path === '/'
</script>

<style scoped>
aside .hello p {
	font-size: 2em !important;
}
</style>
