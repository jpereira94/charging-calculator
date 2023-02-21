import { getField, updateField } from 'vuex-map-fields'

export const state = () => ({
  counter: 0,
  standards: ['IEC_62196_T2', 'IEC_62196_T2_COMBO'],
  CHADEMO_charging_rate: 0,
  IEC_62196_T2_charging_rate: 11,
  IEC_62196_T2_COMBO_charging_rate: 170,
})

export const getters = {
  getField,
}

export const mutations = {
  updateStandards(state, value) {
    state.standards = value
  },
  updateField,
  initialiseStore(state) {
    // Check if the ID exists
    if (localStorage.getItem('store')) {
      // Replace the state object with the stored item
      this.replaceState(
        Object.assign(state, JSON.parse(localStorage.getItem('store')))
      )
    }
  },
}

export const actions = {
  // async fetchCounter({ state }) {
  //   // make request
  //   const res = { data: 10 }
  //   state.counter = res.data
  //   return res.data
  // },
}
