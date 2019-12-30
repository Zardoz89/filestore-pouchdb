// import '@babel/polyfill'
import Vue from 'vue'
import App from './App.vue'

const app = new Vue({
  render: h => h(App)
}).$mount('#app')

export default app

// vim: set backupcopy=yes :

