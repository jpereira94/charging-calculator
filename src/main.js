import Vue from 'vue';
import App from './App.vue';
import vSelect from 'vue-select';
Vue.component('v-select', vSelect);
import 'vue-select/dist/vue-select.css';
import _ from 'lodash';

import VueRouter from 'vue-router';
Vue.use(VueRouter);

Vue.config.productionTip = false;

// 2. Define some routes
// Each route should map to a component. The "component" can
// either be an actual component constructor created via
// `Vue.extend()`, or just a component options object.
// We'll talk about nested routes later.
const routes = [
  { path: '/dados', component: () => import('./Dados.vue') },
  { path: '/', component: () => import('./Otimizador.vue') },
];

// 3. Create the router instance and pass the `routes` option
// You can pass in additional options here, but let's
// keep it simple for now.
const router = new VueRouter({
  routes, // short for `routes: routes`
});

new Vue({
  render: (h) => h(App),
  router,
}).$mount('#app');

Vue.filter('euro', function (value, precision = 4) {
  if (!value) return '';

  // return '€' + _.round(value, precision).toFixed(precision);
  return _.round(value, precision).toFixed(precision);
});
