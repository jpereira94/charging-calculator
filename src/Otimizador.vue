<template>
  <section class="section">
    <div class="container">
      <div class="columns">
        <div class="column is-4">
          <div class="field">
            <label for="" class="label">Energia (kWh)</label>
            <div class="control">
              <input type="number" class="input" v-model="energia" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <pre>{{ connectorStandards }}</pre>
    <pre>{{ $data }}</pre>
  </section>
</template>

<script>
// import Papa from 'papaparse';
import _ from 'lodash';

export default {
  data() {
    return {
      energia: 0,
      postos: [],

      car: {
        max_ac_power: 11000,
        connectors: ['IEC_62196_T2', 'IEC_62196_T2_COMBO'],
      },
    };
  },
  computed: {
    connectorStandards() {
      // return _.chain(this.postos).flatMap('evses').flatMap('connectors').map('power_type').uniq().value();
      return _.chain(this.postos)
        .flatMap('evses')
        .filter((p) => p.connectors.length > 1)
        .value();
    },
    timeToChargePerPost() {
      return null;
    },
  },
  mounted() {
    fetch('https://ocpi.mobinteli.com/2.2/locations')
      .then((res) => res.json())
      .then((data) => {
        // this.postos = data
        data = data.filter((p) => p.id.includes('FAR'));

        this.postos = data.map((p) => ({
          ...p,
          evses: p.evses.map((e) => ({
            ...e,
            connectors: e.connectors[0],
          })),
        }));
      });
  },
};
</script>

<style></style>
