<template>
  <div id="app">
    <div class="container is-max-desktop">
      <div class="columns pt-3">
        <div class="column">
          <div class="field">
            <label for="" class="label">Posto</label>
            <div class="control">
              <div class="select is-fullwidth">
                <select v-model="posto">
                  <option v-for="(posto, key) in tarifas" :key="key" :value="key">{{ key }}</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div class="column">
          <div class="field">
            <label class="label">kWh</label>
            <div class="control">
              <input class="input" type="number" v-model="kwh" />
            </div>
          </div>
        </div>
        <div class="column">
          <div class="field">
            <label class="label">Velocidade</label>
            <div class="control">
              <input class="input" type="number" v-model="velocidade" />
            </div>
          </div>
        </div>
        <div class="column">
          <div class="field">
            <label class="label">Tempo</label>
            <div class="control">
              <input class="input" placeholder="Horas" type="number" v-model="horas" />
            </div>
          </div>
        </div>

        <div class="column">
          <div class="field">
            <label class="label">&nbsp;</label>
            <div class="control">
              <input class="input" placeholder="Minutos" type="number" v-model="minutos" />
            </div>
          </div>
        </div>
      </div>

      <table class="table is-fullwidth is-bordered">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Quant</th>
            <th>Val. Unit.</th>
            <th>Sub Total</th>
          </tr>
        </thead>
        <tr v-for="(linha, idx) in linhas" :key="idx">
          <td>
            {{ linha.nome }}
          </td>

          <td>
            {{ linha.quant }}
          </td>
          <td>
            {{ linha.valor | euro }}
          </td>
          <td>
            {{ (linha.quant * linha.valor) | euro }}
          </td>
        </tr>
        <tfoot>
          <tr>
            <td colspan="3">Total</td>
            <td>{{ total | euro(2) }}</td>
          </tr>
        </tfoot>
        <!-- <tr>
          <td>kWh</td>
          <td>Tempo</td>
          <td>OPC Ativação</td>
          <td>OPC €/kWh</td>
          <td>OPC €/min</td>
        </tr>
        <tr>
          <td>{{ kwh }}</td>
          <td>{{ tempo }} min</td>
          <td>{{ valorOPC.charge }}</td>
          <td>{{ valorOPC.kWh }}</td>
          <td>{{ valorOPC.min }}</td>
        </tr> -->
      </table>
      <pre>{{ cemes }}</pre>
    </div>
  </div>
</template>

<script>
import Papa from 'papaparse';
import _ from 'lodash';

export default {
  name: 'App',
  filters: {
    euro: (value, precision = 3) => '€ ' + _.round(value, precision),
  },

  data: () => ({
    tarifas: [],
    kwh: null,
    horas: null,
    minutos: null,
    posto: 'FAR-00025',
    velocidade: null,
    cemes: [
      {
        id: 'prio-electric',
        name: 'PRIO ELECTRIC',
        mode: 'steps',
        steps: [
          { min: 0, max: 3.8, unit: 'min', vazio: 0.011, fora_vazio: 0.012 },
          { min: 3.8, max: 7.5, unit: 'min', vazio: 0.022, fora_vazio: 0.024 },
          { min: 7.5, max: 11.2, unit: 'min', vazio: 0.0327, fora_vazio: 0.0357 },
          { min: 11.2, max: 22.2, unit: 'min', vazio: 0.0653, fora_vazio: 0.0715 },
          { min: 22.2, max: 50.1, unit: 'min', vazio: 0.1336, fora_vazio: 0.1462 },
          { min: 50.1, max: 100, unit: 'min', vazio: 0.2672, fora_vazio: 0.2925 },
          { min: 100.1, max: 150, unit: 'min', vazio: 0.386, fora_vazio: 0.4224 },
          { min: 150.1, max: 360, unit: 'min', vazio: 0.386, fora_vazio: 0.4224 },
        ],
      },
    ],
  }),
  computed: {
    tempo() {
      return parseInt(this.horas || 0) * 60 + parseInt(this.minutos || 0);
    },
    valorOPC() {
      return _.get(this.tarifas, this.posto, { charge: 0, kwh: 0, min: 0 });
    },
    linhas() {
      // const cemeMinValue = this.cemes[0];
      return [
        {
          nome: 'Ativação OPC',
          quant: 1,
          valor: this.valorOPC.charge,
        },
        {
          nome: 'Ativação CEME',
          quant: 1,
          valor: 0,
        },
        {
          nome: 'Taxa Min OPC',
          quant: this.tempo,
          valor: this.valorOPC.min,
        },
        {
          nome: 'Taxa Min CEME',
          quant: this.tempo,
          valor: 0,
        },
        {
          nome: 'Taxa Energia OPC',
          quant: this.kwh,
          valor: this.valorOPC.kwh,
        },
        {
          nome: 'Taxa Energia CEME',
          quant: this.kwh,
          valor: 0,
        },
      ];
    },
    total() {
      return _.sumBy(this.linhas, (l) => l.quant * l.valor);
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
          _.map(keys, () => ({ charge: 0, kwh: 0, min: 0 }))
        );
        _.forEach(results.data, (posto) => {
          this.$set(this.tarifas[posto.ChargingStation], posto.Unit, posto.Value);
        });
      },
    });
  },
};
</script>

<style lang="scss">
@import '../node_modules/bulma/sass/utilities/initial-variables.sass';

@import '../node_modules/bulma/bulma.sass';
// #app {
//   color: $color;
// }
</style>
