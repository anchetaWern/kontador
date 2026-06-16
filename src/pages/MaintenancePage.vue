<template>
  <v-container class="pa-6 maintenance-page">
    <v-card class="maintenance-shell" rounded="xl">
      <v-card-text class="pa-5 pa-sm-6">
        <div class="maintenance-header">
          <div>
            <div class="maintenance-eyebrow">Room Maintenance</div>
            <h1 class="maintenance-title">Track maintenance per room</h1>
            <p class="maintenance-subtitle">
              Save the latest maintenance date for each room and category.
            </p>
          </div>
        </div>

        <v-select
          v-model="selectedApartment"
          label="Apartment"
          :items="apartmentNames"
          class="mt-4"
          hide-details
        />

        <v-alert
          v-if="!apartmentNames.length"
          type="info"
          variant="tonal"
          class="mt-4"
        >
          Add an apartment first in Apartment Setup to start tracking maintenance.
        </v-alert>

        <v-alert
          v-else-if="!selectedApartment"
          type="info"
          variant="tonal"
          class="mt-4"
        >
          Select an apartment to manage room maintenance.
        </v-alert>

        <div v-else class="room-grid mt-6">
          <v-card
            v-for="room in roomMaintenanceCards"
            :key="room.room"
            class="room-card"
            rounded="xl"
            variant="outlined"
          >
            <v-card-text>
              <div class="room-topline">
                <div>
                  <div class="room-label">Room</div>
                  <div class="room-value">{{ room.room }}</div>
                </div>
              </div>

              <div class="maintenance-list">
                <div
                  v-for="item in room.items"
                  :key="`${room.room}-${item.type}`"
                  class="maintenance-item"
                >
                  <v-btn
                    block
                    color="primary"
                    variant="flat"
                    class="maintenance-button"
                    @click="openMaintenanceDialog(room.room, item)"
                  >
                    {{ item.label }}
                  </v-btn>

                  <div class="maintenance-date">
                    {{ item.lastMaintainedLabel }}
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialogOpen" max-width="420">
      <v-card rounded="xl">
        <v-card-title class="text-wrap">
          Save {{ activeMaintenance.label || 'Maintenance' }}
        </v-card-title>

        <v-card-text>
          <div class="dialog-room mb-4">
            {{ selectedApartment }} · {{ activeMaintenance.room }}
          </div>

          <v-text-field
            v-model="maintenanceDate"
            label="Date"
            type="date"
            hide-details
          />
        </v-card-text>

        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" @click="saveMaintenance">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import {
  getApartments,
  getLatestMaintenanceDate,
  saveMaintenanceEntry
} from '../utils/storage'

const maintenanceTypes = [
  { type: 'aircon', label: 'Aircon Maintenance' },
  { type: 'water', label: 'Water Maintenance' },
  { type: 'painting', label: 'Painting Maintenance' },
  { type: 'cleaning', label: 'Cleaning Maintenance' },
  { type: 'toilet', label: 'Toilet Maintenance' }
]

const refreshKey = ref(0)
const selectedApartment = ref('')
const dialogOpen = ref(false)
const maintenanceDate = ref('')
const activeMaintenance = ref({
  room: '',
  type: '',
  label: ''
})

const apartments = computed(() => {
  refreshKey.value
  return getApartments()
})

const apartmentNames = computed(() => apartments.value.map(apartment => apartment.name))

watch(
  apartmentNames,
  names => {
    if (!names.length) {
      selectedApartment.value = ''
      return
    }

    if (!names.includes(selectedApartment.value)) {
      selectedApartment.value = names[0]
    }
  },
  { immediate: true }
)

const formatMaintenanceDate = value => {
  if (!value) return 'No history yet'

  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return 'No history yet'

  return `Last maintained: ${parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })}`
}

const roomMaintenanceCards = computed(() => {
  refreshKey.value

  if (!selectedApartment.value) return []

  const apartment = apartments.value.find(item => item.name === selectedApartment.value)
  if (!apartment) return []

  return [...apartment.rooms]
    .sort((first, second) => first.localeCompare(second, undefined, { numeric: true }))
    .map(room => ({
      room,
      items: maintenanceTypes.map(item => ({
        ...item,
        lastMaintainedLabel: formatMaintenanceDate(
          getLatestMaintenanceDate(selectedApartment.value, room, item.type)
        )
      }))
    }))
})

const getTodayDate = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const openMaintenanceDialog = (room, item) => {
  activeMaintenance.value = {
    room,
    type: item.type,
    label: item.label
  }
  maintenanceDate.value = getTodayDate()
  dialogOpen.value = true
}

const closeDialog = () => {
  dialogOpen.value = false
  maintenanceDate.value = ''
  activeMaintenance.value = {
    room: '',
    type: '',
    label: ''
  }
}

const saveMaintenance = () => {
  if (!selectedApartment.value || !activeMaintenance.value.room || !maintenanceDate.value) return

  saveMaintenanceEntry(
    selectedApartment.value,
    activeMaintenance.value.room,
    activeMaintenance.value.type,
    maintenanceDate.value
  )

  refreshKey.value += 1
  closeDialog()
}
</script>

<style scoped>
.maintenance-page {
  max-width: 1200px;
}

.maintenance-shell {
  background:
    radial-gradient(circle at top right, rgba(56, 142, 60, 0.12), transparent 30%),
    linear-gradient(180deg, #f8fff7 0%, #ffffff 100%);
  border: 1px solid rgba(56, 142, 60, 0.16);
}

.maintenance-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.maintenance-eyebrow {
  color: #2e7d32;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.maintenance-title {
  margin: 8px 0 4px;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  line-height: 1.05;
}

.maintenance-subtitle {
  margin: 0;
  max-width: 620px;
  color: rgba(0, 0, 0, 0.68);
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.room-card {
  border-color: rgba(56, 142, 60, 0.18);
}

.room-topline {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.room-label {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.55);
}

.room-value {
  font-size: 1.4rem;
  font-weight: 800;
}

.maintenance-list {
  display: grid;
  gap: 14px;
}

.maintenance-item {
  display: grid;
  gap: 8px;
}

.maintenance-button {
  justify-content: flex-start;
}

.maintenance-date {
  font-size: 0.95rem;
  color: rgba(0, 0, 0, 0.68);
}

.dialog-room {
  color: rgba(0, 0, 0, 0.68);
  font-weight: 600;
}
</style>
