<template>
  <Nuxt></Nuxt>
</template>

<script>
export default {
  created() {
    this.$store.commit('initialiseStore')

    this.unsubscribe = this.$store.subscribe((mutation, state) => {
      localStorage.setItem('store', JSON.stringify(state))
    })
  },
  beforeDestroy() {
    this.unsubscribe()
  },
}
</script>

<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, avenir next, avenir, segoe ui,
    helvetica neue, helvetica, Cantarell, Ubuntu, roboto, noto, arial,
    sans-serif;
}
</style>
