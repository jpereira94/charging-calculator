<template>
  <div id="app">
    <section class="section">
      <div class="container is-max-desktop">
        <div class="columns is-multiline">
          <div class="column is-6">
            <div class="field">
              <label for="" class="label">CEME</label>
              <div class="control">
                <v-select :options="Object.values(cemes)" label="nome" v-model="ceme"></v-select>
              </div>
            </div>
          </div>
          <div class="column is-6">
            <div class="field">
              <label for="" class="label">Posto</label>
              <div class="control">
                <v-select :options="Object.values(postos)" label="nome" v-model="posto"></v-select>
              </div>
            </div>
          </div>

          <div class="column is-4">
            <div class="field">
              <label for="" class="label">Energia (kWh)</label>
              <div class="control">
                <input type="number" class="input" v-model="kwh" />
              </div>
            </div>
          </div>
          <div class="column is-4">
            <div class="field">
              <label for="" class="label">Tempo</label>
              <div class="control">
                <input type="text" class="input" v-model="tempo" @change="validarTempo" />
              </div>
            </div>
          </div>
          <div class="column is-4">
            <div class="field">
              <label for="" class="label">Horario</label>
              <div class="control">
                <div class="select is-fullwidth">
                  <select v-model="horario">
                    <option value="vazio">Vazio</option>
                    <option value="fora_vazio">Fora Vazio</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <pre>{{ ceme }}</pre>
        <pre>{{ posto }}</pre>
        <h1 class="title">TOTAIS</h1>
        <table class="table is-fullwidth is-bordered">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Quant</th>
              <th>Unid.</th>
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
              {{ linha.unid }}
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
              <td colspan="4">Total</td>
              <td>{{ total | euro(2) }}</td>
            </tr>
          </tfoot>
        </table>

        Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nisi a est deserunt! Non quidem incidunt aspernatur
        quisquam, possimus id eius aperiam veritatis quae suscipit a inventore magni, deserunt rerum! Consequatur.
      </div>
    </section>
  </div>
</template>

<script>
import Papa from 'papaparse';
import _ from 'lodash';

export default {
  name: 'App',
  filters: {
    euro: (value, precision = 4) => '€ ' + _.round(value, precision).toFixed(precision),
  },
  computed: {
    linhas() {
      const linhas = [];
      if (this.ceme) {
        linhas.push({
          nome: 'CEME activação',
          unid: 'carreg.',
          quant: 1,
          valor: this.ceme.activacao,
        });

        // nao gosto mt da logica do valor
        linhas.push({
          nome: 'CEME vazio',
          unid: this.ceme.unid,
          quant: this[this.ceme.unid] * (this.horario == 'vazio' ? 1 : 0),
          valor: this.ceme.vazio - (this.ceme.inclui_tar ? this.tar[this.horario] : 0),
        });

        linhas.push({
          nome: 'CEME fora vazio',
          unid: this.ceme.unid,
          quant: this[this.ceme.unid] * (this.horario == 'fora_vazio' ? 1 : 0),
          valor: this.ceme.fora_vazio - (this.ceme.inclui_tar ? this.tar[this.horario] : 0),
        });
      }

      if (this.posto) {
        const parcelaPorCarregamento = _.find(this.posto.parcelas, { Unit: 'charge' });
        if (parcelaPorCarregamento) {
          linhas.push({
            nome: 'OPC activação',
            unid: 'carreg.',
            quant: 1,
            valor: parcelaPorCarregamento.Value,
          });
        }
        const parcelas = _.reject(this.posto.parcelas, { Unit: 'charge' });
        parcelas.forEach((parcela) => {
          if (parcela.MaxLevelValue !== 'NA' || parcela.StartHour !== 'NA') {
            console.warn('Caso especial, a ignorar...');
            return;
          }
          if (parcela.Unit === 'min') {
            linhas.push({
              nome: 'OPC tempo',
              unid: 'min',
              quant: this.tempo,
              valor: parcela.Value,
            });
          }
          if (parcela.Unit === 'kWh') {
            linhas.push({
              nome: 'OPC energia',
              unid: 'kwh',
              quant: this.kwh,
              valor: parcela.Value,
            });
          }
        });
        // 516 819 470
        // linhas.push({
        //   nome: 'OPC vazio',
        //   unid: this.ceme.unid,
        //   quant: this[this.ceme.unid] * (this.horario == 'vazio' ? 1 : 0),
        //   valor: this.ceme.vazio - (this.ceme.inclui_tar ? this.tar[this.horario] : 0),
        // });
        // linhas.push({
        //   nome: 'OPC fora vazio',
        //   unid: this.ceme.unid,
        //   quant: this[this.ceme.unid] * (this.horario == 'fora_vazio' ? 1 : 0),
        //   valor: this.ceme.fora_vazio - (this.ceme.inclui_tar ? this.tar[this.horario] : 0),
        // });
      }

      linhas.push({
        nome: 'IVA',
        unid: '€',
        quant: _.sum(linhas.map((l) => l.quant * l.valor)),
        valor: 0.23,
      });

      linhas.push({
        nome: 'IEC',
        unid: 'kwh',
        quant: this.kwh,
        valor: 0.001,
      });

      linhas.push({
        nome: 'TAR',
        unid: 'kwh',
        quant: this.kwh,
        valor: this.tar[this.horario],
      });

      return linhas;
    },
    total() {
      return _.sumBy(this.linhas, (l) => l.quant * l.valor);
    },
    tar() {
      // todo MT/BT
      return {
        vazio: -0.1125,
        fora_vazio: -0.0635,
      };
    },
  },

  data: () => ({
    kwh: 19,
    tempo: 308,
    horario: 'vazio',
    postos: [],
    cemes: [],
    ceme: {
      nome: 'viaverde | ecochoice',
      inclui_tar: false,
      activacao: 0.035,
      unid: 'kwh',
      vazio: 0.1616,
      fora_vazio: 0.1616,
      min: 0,
      max: null,
    },
    posto: {
      nome: 'FAR-90007',
      parcelas: [
        {
          ChargingStation: 'FAR-90007',
          Unit: 'min',
          Value: 0.004,
          MinLevelValue: 0,
          MaxLevelValue: 'NA',
          StartHour: 'NA',
          EndHour: 'NA',
        },
      ],
    },
  }),
  async mounted() {
    Papa.parse('https://www.mobie.pt/documents/42032/106470/Tarifas', {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        // console.log(results);
        this.postos = _.chain(results.data)
          .groupBy('ChargingStation')
          .map((posto) => ({
            nome: posto[0].ChargingStation,
            parcelas: posto,
          }))
          .value();
        // const keys = _.chain(results.data).map('ChargingStation').uniq().value();
        // this.postos = _.zipObject(
        //   keys,
        //   _.map(keys, (k) => ({ nome: k, charge: 0, kwh: 0, min: 0 }))
        // );
        // _.forEach(results.data, (posto) => {
        //   this.$set(this.postos[posto.ChargingStation], posto.Unit, posto.Value);
        // });
      },
    });
    Papa.parse(`${process.env.BASE_URL}ceme.csv`, {
      header: true,
      dynamicTyping: true,
      download: true,
      // delimiter: ';',
      complete: (results) => {
        // console.log(results);
        this.cemes = results.data;
      },
    });
  },
  methods: {
    validarTempo() {
      console.log(this.tempo);
      if (typeof this.tempo == 'string') {
        console.log(this.tempo);
      }
    },
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
