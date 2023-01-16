<template>
  <section class="section">
    <div class="columns mb-3">
      <div class="column is-3">
        <div class="field">
          <label for="" class="label">Energia (kWh)</label>
          <div class="control">
            <input type="number" class="input" v-model="energia" />
          </div>
        </div>
      </div>
    </div>
    <table class="table is-fullwidth">
      <thead>
        <tr>
          <th>ID</th>
          <th>standard</th>
          <th>address</th>
          <th class="has-text-centered">max_electric_power</th>
          <th>Voltage</th>
          <th>time</th>
          <th>charge_cost</th>
          <th>minute_cost</th>
          <th>energy_cost</th>
          <th>total</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in timeToChargePerPost" :key="row.evse_id">
          <td>{{ row.evse_id }}</td>
          <td>{{ row.evses.connectors.standard }}</td>
          <td>
            <a :href="row.gmaps" target="_blank">{{ row.address }}</a>
          </td>

          <!-- https://maps.google.com/?q=<lat>,<lng> -->
          <!-- https://www.google.com/maps/search/?api=1&query=<lat>,<lng> -->
          <td class="has-text-centered">{{ row.evses.connectors.max_electric_power / 1000 }}</td>
          <td>{{ row.mobie_voltage_level }}</td>
          <td>{{ row.time_to_charge_minutes | displayTime }}</td>
          <td>{{ row.charge_cost | euro }}</td>
          <td>{{ row.minute_cost | euro }}</td>
          <td>{{ row.energy_cost | euro }}</td>
          <td>{{ row.total_cost | euro(2) }}</td>
        </tr>
      </tbody>
    </table>

    <!-- <pre>{{ tarifas }}</pre> -->
    <!-- <pre>{{ $data }}</pre> -->
  </section>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import Papa from 'papaparse';
import Postos from './postos.json';
import Custos from './tarifas.json';
import _ from 'lodash';

export default {
  name: 'AppOtimizador',
  filters: {
    displayTime(value) {
      const hours = Math.floor(value / 60);
      const minutes = Math.round(value % 60);
      return hours + ':' + _.padStart(minutes, 2, 0);
    },
  },
  data() {
    return {
      energia: 19,
      postos: [],
      tarifas: [],
      car: {
        max_ac_power: 11000,
        max_dc_power: 170000,
        connectors: ['IEC_62196_T2', 'IEC_62196_T2_COMBO'],
      },
    };
  },
  computed: {
    connectorStandards() {
      return _.chain(this.postos).map('mobie_mobi_charger').uniq().value();
    },
    timeToChargePerPost() {
      return _.chain(this.postos)
        .filter((p) => this.car.connectors.includes(p.evses.connectors.standard))
        .uniqBy((p) => p.id + p.evses.connectors.standard + p.evses.connectors.max_electric_power)
        .map((p) => {
          let max_charge_rate = p.evses.connectors.max_electric_power;
          if (p.evses.connectors.power_type.includes('AC')) {
            max_charge_rate = _.clamp(max_charge_rate, this.car.max_ac_power);
          } else {
            max_charge_rate = _.clamp(max_charge_rate, this.car.max_dc_power);
          }

          const time_to_charge_minutes = ((this.energia * 1000) / max_charge_rate) * 60;
          const tarifas = this.tarifas[p.id];

          const charge_cost = tarifas?.charge?.Value || 0;
          const minute_cost = tarifas?.min?.Value * time_to_charge_minutes || 0;
          const energy_cost = tarifas?.kWh?.Value * this.energia || 0;

          return {
            ...p,
            tarifas,
            time_to_charge_minutes,
            charge_cost,
            minute_cost,
            energy_cost,
            total_cost: charge_cost + minute_cost + energy_cost,
            gmaps: `https://maps.google.com/?q=${p.coordinates.latitude},${p.coordinates.longitude}`,
          };
        })
        .sortBy('total_cost')
        .value();
    },
  },
  mounted() {
    // fetch('https://ocpi.mobinteli.com/2.2/locations')
    //   .then((res) => res.json())
    //   .then((data) => {
    //     // this.postos = data
    //     data = data.filter((p) => p.id.includes('LLE'));
    //     this.postos = data.flatMap((p) =>
    //       p.evses.map((e) => ({
    //         ...p,
    //         evse_id: e.uid,
    //         evses: {
    //           ...e,
    //           connectors: e.connectors[0],
    //         },
    //       }))
    //     );
    //   });

    this.postos = Postos.flatMap((p) =>
      p.evses.map((e) => ({
        ...p,
        evse_id: e.uid,
        evses: {
          ...e,
          connectors: e.connectors[0],
        },
      }))
    );

    // Papa.parse('https://www.mobie.pt/documents/42032/106470/Tarifas', {
    //   download: true,
    //   header: true,
    //   dynamicTyping: true,
    //   complete: (results) => {
    //     // console.log(results);
    //     // this.tarifas = results.data;
    //     this.tarifas = _.chain(results.data)
    //       .filter((p) => p?.ChargingStation?.includes('LLE'))
    //       .groupBy('ChargingStation')
    //       .mapValues((tarifa) => _.keyBy(_.filter(tarifa, { MinLevelValue: 0 }), 'Unit'))
    //       .value();
    //   },
    // });
    this.tarifas = _.mapValues(Custos, (tarifa) => _.keyBy(_.filter(tarifa, { MinLevelValue: 0 }), 'Unit'));
  },
};

// {
//       "id": "6070eb3f5671201ad1142bf9",
//       "naming": {
//         "make": "Tesla",
//         "model": "Model 3",
//         "version": "Standard Range Plus",
//         "edition": null,
//         "chargetrip_version": "Standard Range Plus (2021 - 2021)",
//         "__typename": "VehicleListNaming"
//       },
//       "connectors": [
//         {
//           "standard": "IEC_62196_T2",
//           "power": 11,
//           "max_electric_power": 11,
//           "time": 330,
//           "speed": 64,
//           "__typename": "VehicleConnector"
//         },
//         {
//           "standard": "TESLA_S",
//           "power": 105,
//           "max_electric_power": 170,
//           "time": 21,
//           "speed": 700,
//           "__typename": "VehicleConnector"
//         },
//         {
//           "standard": "IEC_62196_T2_COMBO",
//           "power": 105,
//           "max_electric_power": 170,
//           "time": 21,
//           "speed": 700,
//           "__typename": "VehicleConnector"
//         }
//       ],
//       "battery": {
//         "usable_kwh": 51,
//         "full_kwh": 54,
//         "__typename": "VehicleListBattery"
//       },
//       "__typename": "VehicleList"
//     },
</script>

<style></style>
