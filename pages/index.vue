<template>
  <el-container>
    <el-main>
      <h1>EV Charging Simulator Portugal</h1>

      <el-table
        v-loading="$fetch.pending"
        :data="displayData"
        style="width: 100%"
      >
        <el-table-column
          v-for="header in headers"
          :key="header"
          :prop="header"
          :label="header"
        >
        </el-table-column>
      </el-table>

      <el-pagination
        layout="prev, pager, next"
        :current-page.sync="page"
        :total="locations.length"
        :page-size="pageSize"
      >
      </el-pagination>

      <!-- <pre>{{ locations }}</pre> -->
    </el-main>
  </el-container>
</template>

<script>
import Vue from 'vue'
// eslint-disable-next-line no-unused-vars
import Papa from 'papaparse'

export default Vue.extend({
  name: 'IndexPage',

  data() {
    return {
      locations: [],
      page: 1,
      pageSize: 20,
      userLocation: {},
    }
  },
  async fetch() {
    const response = await this.$axios.$get('/api/count')
    this.locations = response

    // const results = await new Promise((resolve, reject) => {
    //   Papa.parse('https://www.mobie.pt/documents/42032/106470/Tarifas', {
    //     download: true,
    //     header: true,
    //     dynamicTyping: true,
    //     complete: resolve,
    //     error: reject,
    //   })
    // })
    // this.locations = results.data

    // console.log(results)
  },
  computed: {
    displayData() {
      return this.locations.slice(
        this.pageSize * (this.page - 1),
        this.pageSize * this.page
      )
    },
    headers() {
      if (this.locations.length === 0) return []
      return Object.keys(this.locations[0])
    },
  },
  // methods: {
  //   async getCount() {
  //     const response = await fetch('http://localhost:3000/api/count')
  //     const data = await response.json()
  //     this.count = data.count
  //   },
  // },
  mounted() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.userLocation.latitude = position.coords.latitude
        this.userLocation.longitude = position.coords.longitude
      },
      (error) => {
        console.error(error.message)
      }
    )
    // this.$notify({
    //   title: 'It works!',
    //   type: 'success',
    //   message:
    //     "We've laid the ground work for you. It's time for you to build something epic!",
    //   duration: 5000,
    // })
  },
})
</script>

<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, avenir next, avenir, segoe ui,
    helvetica neue, helvetica, Cantarell, Ubuntu, roboto, noto, arial,
    sans-serif;
}
</style>
