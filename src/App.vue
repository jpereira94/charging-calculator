<template>
  <div id="app">
    <div class="container is-max-desktop">
      <div class="field">
        <label for="" class="label">Posto</label>
        <div class="control">
          <div class="select">
            <select v-model="posto">
              <option v-for="(posto, key) in tarifas" :key="key" :value="key">{{ key }}</option>
            </select>
          </div>
        </div>
      </div>
      <div class="field">
        <label class="label">KWH</label>
        <div class="control">
          <input class="input" type="number" v-model="kwh" />
        </div>
      </div>

      <div class="field">
        <label class="label">Tempo</label>
        <div class="control">
          <div class="columns">
            <div class="column">
              <input class="input" placeholder="Horas" type="number" v-model="horas" />
            </div>
            <div class="column">
              <input class="input" placeholder="Minutos" type="number" v-model="minutos" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <pre>{{ tempo }}</pre>
  </div>
</template>

<script>
import Papa from 'papaparse';
import _ from 'lodash';

export default {
  name: 'App',

  data: () => ({
    tarifas: [],
    kwh: null,
    horas: null,
    minutos: null,
    posto: null,
  }),
  computed: {
    tempo() {
      return parseInt(this.horas || 0 * 60) + parseInt(this.minutos || 0);
    },
  },
  async mounted() {
    Papa.parse('https://www.mobie.pt/documents/42032/106470/Tarifas', {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        console.log(results);
        const keys = _.chain(results.data).map('ChargingStation').uniq().value();
        this.tarifas = _.zipObject(
          keys,
          _.map(keys, () => ({ charge: 0, kWh: 0, min: 0 }))
        );
        _.forEach(results.data, (posto) => {
          this.$set(this.tarifas[posto.ChargingStation], posto.Unit, posto.Value);
        });
      },
    });

    // {
    //   "ChargingStation": "ABF-00008",
    //   "Unit": "charge",
    //   "Value": "0.297",
    //   "MinLevelValue": "0",
    //   "MaxLevelValue": "NA",
    //   "StartHour": "NA",
    //   "EndHour": "NA"
    // },
    // {
    //   "ChargingStation": "ABF-00008",
    //   "Unit": "kWh",
    //   "Value": "0.06",
    //   "MinLevelValue": "0",
    //   "MaxLevelValue": "NA",
    //   "StartHour": "NA",
    //   "EndHour": "NA"
    // },
    // {
    //   "ChargingStation": "ABF-00008",
    //   "Unit": "min",
    //   "Value": "0.01",
    //   "MinLevelValue": "0",
    //   "MaxLevelValue": "NA",
    //   "StartHour": "NA",
    //   "EndHour": "NA"
    // }
  },
};
</script>

<style>
@import url('../node_modules/bulma/css/bulma.min.css');
</style>
