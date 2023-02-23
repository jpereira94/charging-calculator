<template>
  <v-container>
    <h1>Calculador Tarifa OPC - Portugal</h1>

    <v-btn-toggle v-model="standards" multiple>
      <v-btn value="CHADEMO">
        <img src="~/assets/CHADEMO.svg" alt="CHADEMO" />
      </v-btn>
      <v-btn value="IEC_62196_T2">
        <img src="~/assets/IEC_62196_T2.svg" alt="IEC_62196_T2" />
      </v-btn>
      <v-btn value="IEC_62196_T2_COMBO">
        <img src="~/assets/IEC_62196_T2_COMBO.svg" alt="IEC_62196_T2_COMBO" />
      </v-btn>
    </v-btn-toggle>

    <v-row class="mt-3">
      <v-col v-if="standards.includes('CHADEMO')" sm="4">
        <v-text-field
          v-model="CHADEMO_charging_rate"
          label="CHADEMO"
          prepend-icon="mdi-ev-plug-chademo"
        >
        </v-text-field>
      </v-col>
      <v-col v-if="standards.includes('IEC_62196_T2')" sm="4">
        <v-text-field
          v-model="IEC_62196_T2_charging_rate"
          label="IEC_62196_T2"
          prepend-icon="mdi-ev-plug-type2"
        >
        </v-text-field>
      </v-col>
      <v-col v-if="standards.includes('IEC_62196_T2_COMBO')" sm="4">
        <v-text-field
          v-model="IEC_62196_T2_COMBO_charging_rate"
          label="IEC_62196_T2_COMBO"
          prepend-icon="mdi-ev-plug-ccs2"
        >
        </v-text-field>
      </v-col>
      <v-col cols="12">
        <v-text-field
          v-model="chargeAmount"
          label="kWh a carregar"
          type="number"
          prepend-icon="mdi-lightning-bolt"
        >
          <div slot="append">kWh</div>
        </v-text-field>
      </v-col>

      <v-col cols="12">
        <v-text-field v-model="local" label="Localidade"> </v-text-field>
      </v-col>
    </v-row>

    <!-- <p style="max-width: 70ch">
      Lorem ipsum dolor sit amet consectetur, adipisicing elit. Quasi nostrum
      dolor quae labore molestias quidem adipisci voluptates, molestiae atque
      minima et veniam aliquid inventore iure distinctio excepturi magni nihil
      non!
    </p> -->

    <v-row v-if="!$fetchState.pending">
      <v-col
        v-for="station in displayData"
        :key="station.uid"
        cols="12"
        sm="6"
        lg="4"
        xl="3"
      >
        <v-card>
          <v-card-title>
            <v-icon class="mr-3">
              {{ station.standard | standardToIcon }}
            </v-icon>
            <span>
              {{ station.id }}
            </span>
          </v-card-title>

          <v-card-text>
            <v-row>
              <v-col cols="6" class="text-center">
                <div class="text-h4">
                  {{ station.totalOPCCost | money }}
                </div>
                <div class="text-overline">Total</div>
              </v-col>

              <v-col cols="6" class="text-center">
                <div class="text-h4">
                  {{ station.chargingTimeInMinutes | toHumanTime }}
                </div>
                <div class="text-overline">Tempo</div>
              </v-col>

              <v-col cols="4" class="text-center">
                <v-icon>mdi-connection</v-icon>
                <div class="text-h5">{{ station.chargeCost | money }}</div>
                <div class="text-overline">Ativação</div>
              </v-col>

              <v-col cols="4" class="text-center">
                <v-icon>mdi-clock-outline</v-icon>
                <div class="text-h5">{{ station.timeCost | money }}</div>
                <div class="text-overline">Tempo</div>
              </v-col>

              <v-col cols="4" class="text-center">
                <v-icon>mdi-lightning-bolt</v-icon>
                <div class="text-h5">{{ station.energyCost | money }}</div>
                <div class="text-overline">Energia</div>
              </v-col>
            </v-row>

            <!-- <pre>{{ station }}</pre> -->
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import Vue from 'vue'
import Papa from 'papaparse'
import { mapFields } from 'vuex-map-fields'
import debounce from 'lodash.debounce'

export default Vue.extend({
  name: 'IndexPage',
  filters: {
    standardToIcon(value) {
      switch (value) {
        case 'CHADEMO':
          return 'mdi-ev-plug-chademo'
        case 'IEC_62196_T2':
          return 'mdi-ev-plug-type2'
        case 'IEC_62196_T2_COMBO':
          return 'mdi-ev-plug-ccs2'
      }
    },
    money(value) {
      return value.toFixed(2) + ' €'
    },
    toHumanTime(value) {
      return Math.floor(value / 60) + ':' + String(value % 60).padStart(2, '0')
    },
  },

  data() {
    return {
      locations: [],
      tarifas: [],
      page: 1,
      pageSize: 20,
      userLocation: {},
      chargeAmount: 30,
      local: '',
      localDebounced: '',
    }
  },
  // eslint-disable-next-line require-await
  async fetch() {
    // const response = await this.$axios.$get('/api/locations')
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
    this.locations = this.locations.filter(
      (x, i, self) =>
        i === self.findIndex((y) => x.id === y.id && x.standard === y.standard)
    )

    // console.log(results)

    // const tarifas = await this.$axios.$get('/api/tarifas')
    // this.tarifas = tarifas

    if (Object.keys(this.tarifas).length === 0) {
      const results = await new Promise((resolve, reject) => {
        Papa.parse('https://www.mobie.pt/documents/42032/106470/Tarifas', {
          download: true,
          header: true,
          dynamicTyping: true,
          complete: resolve,
          error: reject,
        })
      })
      // this.tarifas = results.data
      this.tarifas = results.data
        .filter((t) => t.StartHour === 'NA')
        .reduce((prev, curr) => {
          ;(
            prev[curr.ChargingStation] || (prev[curr.ChargingStation] = [])
          ).push(curr)
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
              station.id
                .toLowerCase()
                .includes(this.localDebounced.toLowerCase())
            // ['ABT-00012', 'FAR-90007', 'FAR-00010'].includes(station.id)
            // this.$measure(
            //   station.coordinates_latitude,
            //   station.coordinates_longitude,
            //   this.userLocation.latitude,
            //   this.userLocation.longitude
            // ) < 10000
          )
          // .filter((station) => station.id.includes('FAR'))
          // .filter((x, i, self) => i === self.findIndex((y) => x.id === y.id))
          .map((station) => {
            const tarifas = this.tarifas[station.id] || []

            const chargeCost =
              tarifas.find((t) => t.Unit === 'charge')?.Value || 0

            const maxChargeRate = Math.min(
              station.max_electric_power,
              parseFloat(this[station.standard + '_charging_rate']) * 1000
            )
            const chargingTimeInMinutes = Math.round(
              ((this.chargeAmount * 1000) / maxChargeRate) * 60
            )
            const timeFares = tarifas.filter((t) => t.Unit === 'min')
            const timeCost = this.calculatePartitionCost(
              chargingTimeInMinutes,
              timeFares
            )

            const energyFares = tarifas.filter((t) => t.Unit === 'kWh')
            const energyCost = this.calculatePartitionCost(
              this.chargeAmount,
              energyFares
            )
            const totalOPCCost = chargeCost + timeCost + energyCost

            return {
              ...station,
              maxChargeRate,
              chargingTimeInMinutes,
              chargeCost,
              timeCost,
              energyCost,
              totalOPCCost,
            }
          })
          .sort((a, b) => a.totalOPCCost - b.totalOPCCost)
      )
    },

    // tarifasTest() {
    //   // return this.tarifas.filter((t) => t.StartHour !== 'NA')
    //   // return this.tarifas.filter((t) => t.ChargingStation === 'ABT-00012')
    //   return this.tarifas['FAR-90007']

    // },

    //      {
    //   "ChargingStation": "CBR-00065",
    //   "Unit": "kWh",
    //   "Value": 0.07,
    //   "MinLevelValue": 0,
    //   "MaxLevelValue": "NA",
    //   "StartHour": 0,
    //   "EndHour": 8
    // },
    // {
    //   "ChargingStation": "CBR-00065",
    //   "Unit": "min",
    //   "Value": 0.025,
    //   "MinLevelValue": 0,
    //   "MaxLevelValue": "NA",
    //   "StartHour": 8,
    //   "EndHour": 0
    // },

    //     {
    //   "ChargingStation": "ABT-00012",
    //   "Unit": "charge",
    //   "Value": 0.5,
    //   "MinLevelValue": 0,
    //   "MaxLevelValue": "NA",
    //   "StartHour": "NA",
    //   "EndHour": "NA"
    // },
    // {
    //   "ChargingStation": "ABT-00012",
    //   "Unit": "kWh",
    //   "Value": 0.35,
    //   "MinLevelValue": 0,
    //   "MaxLevelValue": "NA",
    //   "StartHour": "NA",
    //   "EndHour": "NA"
    // },
    // {
    //   "ChargingStation": "ABT-00012",
    //   "Unit": "min",
    //   "Value": 0,
    //   "MinLevelValue": 0,
    //   "MaxLevelValue": 30,
    //   "StartHour": "NA",
    //   "EndHour": "NA"
    // },
    // {
    //   "ChargingStation": "ABT-00012",
    //   "Unit": "min",
    //   "Value": 0.18,
    //   "MinLevelValue": 30,
    //   "MaxLevelValue": "NA",
    //   "StartHour": "NA",
    //   "EndHour": "NA"
    // }
  },

  watch: {
    local(value) {
      this.debouncedWatch(value)
    },
  },
  created() {
    this.debouncedWatch = debounce((value) => {
      this.localDebounced = value
    }, 500)
  },
  mounted() {
    // navigator.geolocation.getCurrentPosition(
    //   (position) => {
    //     this.$set(this.userLocation, 'latitude', position.coords.latitude)
    //     this.$set(this.userLocation, 'longitude', position.coords.longitude)
    //     this.center = this.markerLatLng = [
    //       position.coords.latitude,
    //       position.coords.longitude,
    //     ]
    //     console.log(this.userLocation)
    //   },
    //   (error) => {
    //     console.error(error.message)
    //   }
    // )
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

    calculatePartitionCost(amount, fares) {
      let cost = 0

      if (fares.length > 0) {
        fares = fares.sort((a, b) => a.MinLevelValue - b.MinLevelValue)
        let remainingTime = amount
        let i = 0
        while (remainingTime > 0) {
          // get the amount of time in this interval, assume NA is infinity
          const timeToSubtract =
            fares[i].MaxLevelValue === 'NA' ? Infinity : fares[i].MaxLevelValue

          cost = fares[i].Value * Math.min(timeToSubtract, remainingTime)

          remainingTime -= timeToSubtract
          i++
        }
      }

      return cost
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
.el-input__suffix {
  display: inline-flex;
  align-items: center;
}
</style>
