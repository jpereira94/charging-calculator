<template>
  <el-container>
    <el-main>
      <h1>EV Charging Simulator Portugal</h1>
      <pre>{{ locations }}</pre>
    </el-main>
  </el-container>
</template>

<script>
import Vue from 'vue'

export default Vue.extend({
  name: 'IndexPage',

  data() {
    return {
      locations: [],
    }
  },
  async fetch() {
    const response = await this.$axios.$get('/api/count')
    this.locations = response

    // for (let i = 0; i < response.length; i++) {
    //   const posto = response[i]
    //   for (let j = 0; j < posto.evses.length; j++) {
    //     const evse = posto.evses[j]
    //     this.locations.push({
    //       id: posto.id,
    //       uid: evse.uid,
    //       country_code: posto.country_code,
    //       party_id: posto.party_id,
    //       address: posto.address,
    //       city: posto.city,
    //       country: posto.country,
    //       postal_code: posto.postal_code,
    //       coordinates_latitude: posto.coordinates.latitude,
    //       coordinates_longitude: posto.coordinates.longitude,
    //       parking_type: posto.parking_type,
    //       standard: evse.connectors[0].standard,
    //       format: evse.connectors[0].format,
    //       power_type: evse.connectors[0].power_type,
    //       max_voltage: evse.connectors[0].max_voltage,
    //       max_amperage: evse.connectors[0].max_amperage,
    //       max_electric_power: evse.connectors[0].max_electric_power,
    //       mobie_voltage_level: posto.mobie_voltage_level,
    //     })
    //   }
    // }

    // this.locations = response
  },
  // methods: {
  //   async getCount() {
  //     const response = await fetch('http://localhost:3000/api/count')
  //     const data = await response.json()
  //     this.count = data.count
  //   },
  // },
  mounted() {
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
