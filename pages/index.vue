<template>
  <el-container>
    <el-main>
      <h1>EV Charging Simulator Portugal</h1>
      <p>Só são listados os postos até 10km do utilizador</p>

      <!-- <el-table
        v-loading="$fetchState.pending"
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
        :total="closestStations.length"
        :page-size="pageSize"
      >
      </el-pagination> -->

      <l-map :zoom="zoom" :center="center">
        <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
        <l-marker :lat-lng="markerLatLng"></l-marker>
        <l-marker
          v-for="station in closestStations"
          :key="station.uid"
          :lat-lng="[
            station.coordinates_latitude,
            station.coordinates_longitude,
          ]"
        ></l-marker>
      </l-map>

      <!-- <pre>{{ tarifas }}</pre> -->
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
      tarifas: {},
      page: 1,
      pageSize: 20,
      userLocation: {},

      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a target="_blank" href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      zoom: 15,
      center: [51.505, -0.159],
      markerLatLng: [51.504, -0.159],
      // withPopup: latLng(47.41322, -1.219482),
      // withTooltip: latLng(47.41422, -1.250482),
      // currentZoom: 11.5,
      // currentCenter: latLng(47.41322, -1.219482),
      // showParagraph: false,
      // mapOptions: {
      //   zoomSnap: 0.5,
      // },
      // showMap: true,
    }
  },
  async fetch() {
    // const response = await this.$axios.$get('/api/count')
    // this.locations = response
    const { data } = await this.$axios.get(
      'https://ocpi.mobinteli.com/2.2/locations'
    )
    for (let i = 0; i < data.length; i++) {
      const posto = data[i]
      for (let j = 0; j < posto.evses.length; j++) {
        const evse = posto.evses[j]
        this.locations.push({
          id: posto.id,
          uid: evse.uid,
          country_code: posto.country_code,
          party_id: posto.party_id,
          address: posto.address,
          city: posto.city,
          country: posto.country,
          postal_code: posto.postal_code,
          coordinates_latitude: posto.coordinates.latitude,
          coordinates_longitude: posto.coordinates.longitude,
          parking_type: posto.parking_type,
          standard: evse.connectors[0].standard,
          format: evse.connectors[0].format,
          power_type: evse.connectors[0].power_type,
          max_voltage: evse.connectors[0].max_voltage,
          max_amperage: evse.connectors[0].max_amperage,
          max_electric_power: evse.connectors[0].max_electric_power,
          mobie_voltage_level: posto.mobie_voltage_level,
        })
      }
    }
    // const results = await new Promise((resolve, reject) => {
    //   Papa.parse('https://www.mobie.pt/documents/42032/106470/Tarifas', {
    //     download: true,
    //     header: true,
    //     dynamicTyping: true,
    //     complete: resolve,
    //     error: reject,
    //   })
    // })
    // this.tarifas = results.data.reduce((prev, curr) => {
    //   ;(prev[curr.ChargingStation] || (prev[curr.ChargingStation] = [])).push(
    //     curr
    //   )
    //   return prev
    // }, {})
    // console.log(results)
  },
  computed: {
    displayData() {
      return this.closestStations.slice(
        this.pageSize * (this.page - 1),
        this.pageSize * this.page
      )
    },
    headers() {
      if (this.displayData.length === 0) return []
      return Object.keys(this.displayData[0])
    },
    closestStations() {
      return (
        this.locations
          // .filter((station) => station.id.includes('FAR'))
          .filter((x, i, self) => i === self.findIndex((y) => x.id === y.id))
          .map((station) => ({
            ...station,
            distance2user: this.$measure(
              station.coordinates_latitude,
              station.coordinates_longitude,
              this.userLocation.latitude,
              this.userLocation.longitude
            ),
          }))
          .filter((station) => station.distance2user < 10000)
        // .sort((a, b) => {
        //   const distA = a.distance2user
        //   const distB = b.distance2user
        //   if (distA < distB) return -1
        //   if (distA > distB) return 1
        //   return 0
        // })
      )
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
        this.$set(this.userLocation, 'latitude', position.coords.latitude)
        this.$set(this.userLocation, 'longitude', position.coords.longitude)
        this.center = this.markerLatLng = [
          position.coords.latitude,
          position.coords.longitude,
        ]
        console.log(this.userLocation)
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
.el-main {
  display: flex;
  flex-direction: column;
  height: 98vh;
}
.leaflet-container {
  flex: 1;
}
</style>
