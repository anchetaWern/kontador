import { createRouter, createWebHistory } from 'vue-router'
import ApartmentSetup from './pages/ApartmentSetup.vue'
import MeterEntry from './pages/MeterEntry.vue'
import LatestEntries from './pages/LatestEntries.vue'

const routes = [
  { path: '/', redirect: '/meter' },
  { path: '/setup', component: ApartmentSetup },
  { path: '/meter', component: MeterEntry },
  { path: '/latest', component: LatestEntries },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
