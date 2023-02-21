<template>
  <el-container>
    <el-main>
      <h1>EV Charging Simulator Portugal</h1>
      <!-- <p>Só são listados os postos até 10km do utilizador</p> -->

      <el-checkbox-group v-model="standards">
        <el-checkbox-button label="CHADEMO">
          <!-- <img src="~/assets/CHADEMO.svg" /> -->
        </el-checkbox-button>
        <el-checkbox-button label="IEC_62196_T2">
          <!-- <img src="~/assets/IEC_62196_T2.svg" /> -->
        </el-checkbox-button>
        <el-checkbox-button label="IEC_62196_T2_COMBO">
          <!-- <img src="~/assets/IEC_62196_T2_COMBO.svg" /> -->
        </el-checkbox-button>
      </el-checkbox-group>

      <p>Velocidade carregamento máxima (em kw)</p>
      <el-row :gutter="10" style="margin-bottom: 15px">
        <el-col v-if="standards.includes('CHADEMO')" :span="8">
          <el-input
            v-model="CHADEMO_charging_rate"
            type="number"
            placeholder="CHADEMO_charging_rate"
          >
            <span slot="prefix" class="el-input__icon">
              <img src="~/assets/CHADEMO.svg" />
            </span>
          </el-input>
        </el-col>
        <el-col v-if="standards.includes('IEC_62196_T2')" :span="8">
          <el-input
            v-model="IEC_62196_T2_charging_rate"
            type="number"
            placeholder="IEC_62196_T2_charging_rate"
          >
            <span slot="prefix" class="el-input__icon">
              <img src="~/assets/IEC_62196_T2.svg" /> </span
          ></el-input>
        </el-col>
        <el-col v-if="standards.includes('IEC_62196_T2_COMBO')" :span="8">
          <el-input
            v-model="IEC_62196_T2_COMBO_charging_rate"
            type="number"
            placeholder="IEC_62196_T2_COMBO_charging_rate"
          >
            <span slot="prefix" class="el-input__icon">
              <img src="~/assets/IEC_62196_T2_COMBO.svg" /> </span
          ></el-input>
        </el-col>
      </el-row>

      <el-input
        v-model="chargeAmount"
        placeholder="kWh a carregar"
        type="number"
      >
      </el-input>
      <pre>{{ tarifas }}</pre>

      <el-table
        v-loading="$fetchState.pending"
        :data="displayData"
        style="width: 100%"
      >
        <el-table-column
          v-for="header in headers"
          :key="header"
          :prop="header"
          :label="header"
          sortable
        >
        </el-table-column>
      </el-table>

      <el-pagination
        layout="prev, pager, next"
        :current-page.sync="page"
        :total="closestStations.length"
        :page-size="pageSize"
      >
      </el-pagination>
    </el-main>
  </el-container>
</template>

<script>
import Vue from 'vue'
import Papa from 'papaparse'
import { mapFields } from 'vuex-map-fields'

export default Vue.extend({
  name: 'IndexPage',

  data() {
    return {
      locations: [],
      tarifas: {},
      page: 1,
      pageSize: 20,
      userLocation: {},
      chargeAmount: 30,
    }
  },
  // eslint-disable-next-line require-await
  async fetch() {
    const response = await this.$axios.$get('/api/locations')
    this.locations = response

    const tarifas = await this.$axios.$get('/api/tarifas')
    this.tarifas = tarifas

    // const { data } = await this.$axios.get(
    //   'https://ocpi.mobinteli.com/2.2/locations'
    // )
    // for (let i = 0; i < data.length; i++) {
    //   const posto = data[i]
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
    // this.locations = this.locations.filter(
    //   (x, i, self) =>
    //     i === self.findIndex((y) => x.id === y.id && x.standard === y.standard)
    // )

    // console.log(results)

    if (this.tarifas.length === 0) {
      const results = await new Promise((resolve, reject) => {
        Papa.parse('https://www.mobie.pt/documents/42032/106470/Tarifas', {
          download: true,
          header: true,
          dynamicTyping: true,
          complete: resolve,
          error: reject,
        })
      })
      this.tarifas = results.data.reduce((prev, curr) => {
        ;(prev[curr.ChargingStation] || (prev[curr.ChargingStation] = [])).push(
          curr
        )
        return prev
      }, {})
    }
  },
  computed: {
    // The `mapFields` function takes an array of
    // field names and generates corresponding
    // computed properties with getter and setter
    // functions for accessing the Vuex store.
    ...mapFields([
      'standards',
      'CHADEMO_charging_rate',
      'IEC_62196_T2_charging_rate',
      'IEC_62196_T2_COMBO_charging_rate',
    ]),

    // carStandards: {
    //   get() {
    //     return this.$store.state.standards
    //   },
    //   set(value) {
    //     this.$store.commit('updateStandards', value)
    //   },
    // },

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
          .filter(
            (station) =>
              this.standards.includes(station.standard) &&
              this.$measure(
                station.coordinates_latitude,
                station.coordinates_longitude,
                this.userLocation.latitude,
                this.userLocation.longitude
              ) < 10000
          )
          // .filter((station) => station.id.includes('FAR'))
          // .filter((x, i, self) => i === self.findIndex((y) => x.id === y.id))
          .map((station) => {
            const maxChargeRate = Math.min(
              station.max_electric_power,
              parseFloat(this[station.standard + '_charging_rate']) * 1000
            )

            return {
              ...station,
              maxChargeRate,
              time2charge: (this.chargeAmount * 1000) / maxChargeRate,
            }
          })
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
  methods: {
    updateCenter(center) {
      console.log(center)
    },
  },
})
</script>

<style>
/* .el-main {
  display: flex;
  flex-direction: column;
  height: 98vh;
}
.map-container {
  flex: 1;
} */
.el-checkbox-group {
  margin-bottom: 10px;
}
/* .el-checkbox-button__inner img {
  height: 32px;
} */
.el-checkbox-button.is-checked .el-checkbox-button__inner img {
  filter: brightness(0) invert(1);
}
.el-input__prefix .el-input__icon {
  display: inline-flex;
  align-items: center;
  width: 32px;
}

.el-input__prefix .el-input__icon img {
  opacity: 0.3;
  width: 32px;
}
.el-input--prefix .el-input__inner {
  padding-left: 40px;
}
.el-input__suffix-inner {
  display: inline-flex;
  align-items: center;
}
</style>
