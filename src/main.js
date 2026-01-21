import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// Icons
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

import { registerSW } from 'virtual:pwa-register'

registerSW({
  immediate: true
})


// Vuetify theme setup
const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: 'yellowTheme',
    themes: {
      yellowTheme: {
        dark: false,
        colors: {
          primary: '#FBC02D',      // main yellow
          secondary: '#FFD54F',    // lighter yellow for accents
          background: '#FFFDE7',   // very light yellow background
          
          error: '#D32F2F',        // keep error red
          info: '#1976D2',
          success: '#388E3C',
          warning: '#FFA000',       // warning color
        },
      },
    },
  },
})

createApp(App)
  .use(router)
  .use(vuetify)
  .mount('#app')
