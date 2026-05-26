import { createRouter, createWebHistory } from 'vue-router'
import ApartmentSetup from './pages/ApartmentSetup.vue'
import DashboardPage from './pages/DashboardPage.vue'
import MeterEntry from './pages/MeterEntry.vue'
import LatestEntries from './pages/LatestEntries.vue'
import DataBackupAndRestore from './pages/DataBackupAndRestore.vue'
import WifiRate from './pages/WifiRate.vue'
import WaterRate from './pages/WaterRate.vue'
import DueDate from './pages/DueDate.vue'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: DashboardPage },
  { path: '/setup', component: ApartmentSetup },
  { path: '/meter', component: MeterEntry },
  { path: '/wifi-rate', component: WifiRate },
  { path: '/water-rate', component: WaterRate },
  { path: '/due-date', component: DueDate },
  { path: '/latest', component: LatestEntries },
  { path: '/maintenance', component: DataBackupAndRestore },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
