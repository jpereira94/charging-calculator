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
      <div class="column is-3">
        <div class="field">
          <label for="" class="label">Cidade</label>
          <div class="control">
            <input type="text" class="input" @input="debounceInput" v-model="cidadeInput" />
          </div>
        </div>
      </div>
    </div>

    <table class="table is-fullwidth">
      <thead>
        <tr>
          <th>ID</th>
          <th>address</th>
          <th class="has-text-centered">power</th>
          <!-- <th>Voltage</th> -->
          <th>time</th>
          <th>total_opc</th>
          <th>tar_vazio</th>
          <th>tar_fora_vazio</th>
          <th>total_opc + tar_vazio</th>
          <th>total_opc + tar_fora_vazio</th>
          <!-- <th>charge_cost</th>
          <th>minute_cost</th>
          <th>energy_cost</th> -->
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in timeToChargePerPost" :key="row.evse_id">
          <td>
            <span class="icon-text">
              <img
                :src="require(`./assets/${row.evses.connectors.standard}.svg`)"
                :alt="row.evses.connectors.standard"
                class="icon is-medium"
              />
              <span>
                {{ row.evse_id }}
              </span>
            </span>
          </td>
          <td>
            <a :href="row.gmaps" target="_blank">{{ row.address }}</a>
          </td>
          <td class="has-text-centered">
            {{ row.evses.connectors.max_electric_power / 1000 }}
            ({{ row.mobie_voltage_level }})
          </td>
          <td>{{ row.time_to_charge_minutes | displayTime }}</td>
          <!-- <td>{{ row.charge_cost | euro }}</td>
          <td>{{ row.minute_cost | euro }}</td>
          <td>{{ row.energy_cost | euro }}</td> -->
          <td>{{ row.total_opc | euro(2) }}</td>
          <td>{{ row.tar_vazio | euro }}</td>
          <td>{{ row.tar_fora_vazio | euro }}</td>
          <td>{{ (row.total_opc + row.tar_vazio) | euro(2) }}</td>
          <td>{{ (row.total_opc + row.tar_fora_vazio) | euro(2) }}</td>
        </tr>
      </tbody>
    </table>

    <pre>{{ connectorStandards }}</pre>
    <!-- <pre>{{ $data }}</pre> -->
  </section>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import Papa from 'papaparse';

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
      cidade: 'FAR',
      cidadeInput: 'FAR',
      postos: [],
      tarifas: [],
      car: {
        max_ac_power: 11000,
        max_dc_power: 170000,
        connectors: ['IEC_62196_T2', 'IEC_62196_T2_COMBO'],
      },
    };
  },
  created() {},
  computed: {
    connectorStandards() {
      return _.chain(this.postos).map('parking_type').uniq().value();
    },
    tarifasAcessoRedes() {
      // valores por kwh
      return {
        BT: {
          vazio: -0.1125,
          fora_vazio: -0.0635,
        },
        MT: {
          vazio: -0.116,
          fora_vazio: -0.0772,
        },
      };
    },
    // tarCarregamento() {
    //   return {
    //     BT: {
    //       vazio: this.tarifasAcessoRedes.BT.vazio * this.energia,
    //       fora_vazio: this.tarifasAcessoRedes.BT.fora_vazio * this.energia,
    //     },
    //     MT: {
    //       vazio: this.tarifasAcessoRedes.MT.vazio * this.energia,
    //       fora_vazio: this.tarifasAcessoRedes.MT.fora_vazio * this.energia,
    //     },
    //   };
    // },
    timeToChargePerPost() {
      return (
        _.chain(this.postos)

          .filter(
            (p) =>
              p.id.toLowerCase().includes(this.cidade.toLowerCase()) &&
              this.car.connectors.includes(p.evses.connectors.standard)
          )
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
            const tar_vazio = this.tarifasAcessoRedes[p.voltage_level]?.vazio * this.energia;
            const tar_fora_vazio = this.tarifasAcessoRedes[p.voltage_level]?.fora_vazio * this.energia;

            return {
              ...p,
              tarifas,
              time_to_charge_minutes,
              charge_cost,
              minute_cost,
              energy_cost,
              total_opc: charge_cost + minute_cost + energy_cost,
              gmaps: `https://maps.google.com/?q=${p.coordinates.latitude},${p.coordinates.longitude}`,
              tar_vazio,
              tar_fora_vazio,
            };
          })
          // .sortBy((p) => p.total_opc + p.tar_fora_vazio)
          .sortBy('total_opc')
          .value()
      );
    },
  },
  mounted() {
    fetch('https://ocpi.mobinteli.com/2.2/locations')
      .then((res) => res.json())
      .then((data) => {
        // this.postos = data
        // data = data.filter((p) => p.id.includes('LLE'));
        this.postos = data.flatMap((p) =>
          p.evses.map((e) => ({
            ...p,
            evse_id: e.uid,
            evses: {
              ...e,
              connectors: e.connectors[0],
            },
            voltage_level:
              p.mobie_voltage_level.includes('BT') || p.mobie_voltage_level === 'NONE' ? 'BT' : p.mobie_voltage_level,
          }))
        );
      });
    // 'ON_STREET', 'PARKING_GARAGE', 'PARKING_LOT', 'ALONG_MOTORWAY', 'UNDERGROUND_GARAGE', 'ON_DRIVEWAY'
    // ["ABF","ABT","ACB","ACH","ACN","ACT","ADL","ADV","AFE","AGB","AGD","AGH","AGN","AJT","AJZ","ALB","ALD","ALJ","ALM","ALQ","ALR","ALT","AMD","AMM","AMR","AMT","AND","ANS","APC","ARC","ARL","ARR","ARV","ASL","AVR","AVS","AVT","AVV","AVZ","AZB","BAO","BBR","BCL","BGC","BJA","BMT","BNV","BRB","BRC","BRG","BRR","BTC","BTL","CBA","CBC","CBR","CBT","CCH","CDN","CDR","CDV","CHM","CHT","CHV","CLB","CLD","CLT","CML","CMN","CMR","CNF","CNS","CNT","CPR","CPV","CRS","CRT","CRV","CRZ","CSC","CTB","CTM","CTX","CVD","CVL","CVR","ELV","ENT","EPS","ESP","ETR","ETZ","EVR","FAF","FAG","FAL","FAR","FCR","FEC","FEU","FIG","FLG","FND","FTR","FUN","FVN","FZZ","GAV","GDL","GDM","GLG","GMR","GOI","GRD","GVA","HRT","IDN","ILH","LAG","LGA","LGF","LGP","LGS","LLE","LMG","LNH","LOU","LRA","LRS","LSA","LSB","LSD","MAC","MAD","MAI","MBR","MCD","MCH","MCN","MCQ","MCV","MDB","MDL","MDR","MED","MFR","MFT","MGD","MGL","MGR","MIR","MLD","MLG","MMN","MMV","MNC","MOR","MOU","MRA","MRS","MRT","MRV","MSF","MTA","MTG","MTJ","MTL","MTR","MTS","MUR","NIS","NLS","NRD","NZR","OAZ","OBD","OBR","ODM","ODV","OER","OFR","OHP","OLH","OLR","ORM","ORQ","OVR","PBL","PCR","PCT","PCV","PDL","PFR","PGR","PLM","PMS","PMZ","PNC","PND","PNF","PNH","PNI","PNL","PNV","PPS","PRD","PRG","PRL","PRS","PRT","PSR","PST","PTB","PTG","PTL","PTM","PTS","PVC","PVL","PVZ","RAM","RBR","RDD","RGR","RMR","RMZ","RPN","RSD","SAT","SBA","SBG","SBR","SCD","SCF","SCG","SCR","SEI","SJM","SJP","SLV","SMA","SMG","SMP","SNS","SNT","SPS","SRD","SRE","SRN","SRP","SRQ","SRT","SSB","SSL","STB","STC","STN","STR","STS","SVC","SVV","SXL","TBC","TBR","TBU","TCS","TMC","TMR","TND","TNV","TRC","TRF","TVD","TVR","VBP","VCD","VCT","VDG","VFC","VFL","VFR","VFX","VGS","VIS","VIZ","VLC","VLF","VLG","VLN","VLP","VLR","VLS","VMS","VNB","VNC","VND","VNF","VNG","VNH","VNP","VNT","VPA","VPT","VPV","VRL","VRM","VRS","VVC","VVD","VVR","VZL"]

    // console.log(_.find(Postos, { id: 'FAR-00010' }));

    // this.postos = Postos.flatMap((p) =>
    //   p.evses.map((e) => ({
    //     ...p,
    //     evse_id: e.uid,
    //     evses: {
    //       ...e,
    //       connectors: e.connectors[0],
    //     },
    //     voltage_level: p.mobie_voltage_level.includes('BT') ? 'BT' : p.mobie_voltage_level,
    //   }))
    // );

    Papa.parse('https://www.mobie.pt/documents/42032/106470/Tarifas', {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        this.tarifas = _.chain(results.data)
          .groupBy('ChargingStation')
          .mapValues((tarifa) => _.keyBy(_.filter(tarifa, { MinLevelValue: 0 }), 'Unit'))
          .value();
      },
    });
    // this.tarifas = _.mapValues(Custos, (tarifa) => _.keyBy(_.filter(tarifa, { MinLevelValue: 0 }), 'Unit'));
  },
  methods: {
    debounceInput: _.debounce(function () {
      this.cidade = this.cidadeInput;
    }, 200),
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
