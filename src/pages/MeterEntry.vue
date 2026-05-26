<template>
  <v-app>
    <v-container class="pa-6" max-width="600">
      <v-card>
        <v-card-title>Bill Entry</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="submit">
            <v-select
              v-model="form.apartment"
              label="Apartment"
              :items="apartmentNames"
              required
            />

            <v-select
              v-model="form.room"
              label="Room Number"
              :items="roomOptions"
              :disabled="!form.apartment"
              required
            />

            <v-text-field
              v-model="form.tenant"
              label="Tenant Name"
              required
            />

            <div v-if="dueDateDisplay" class="due-date-text">
              Due Date: {{ dueDateDisplay }}
            </div>

            <v-text-field
              v-model="form.date"
              type="date"
              label="Date"
              required
            />

            <v-text-field
              v-model.number="form.kwh_rate"
              label="kWh Rate"
              type="number"
              step="0.01"
              min="0"
            />

            <v-text-field
              v-model.number="form.prev_reading"
              label="Previous Reading"
              type="number"
              step="0.01"
              min="0"
              required
            />

            <v-text-field
              v-model.number="form.current_reading"
              label="Current Reading"
              type="number"
              step="0.01"
              min="0"
              required
            />

            <v-text-field
              v-model.number="form.wifi_rate"
              label="Wifi Rate"
              type="number"
              step="0.01"
              min="0"
            />

            <v-text-field
              v-model.number="form.water_rate"
              label="Water Rate"
              type="number"
              step="0.01"
              min="0"
            />

            <v-card class="mt-4 summary-card" color="yellow-lighten-5" variant="tonal">
              <v-card-text>
                <div class="summary-label">Bill Breakdown: {{ form.room || 'No room selected' }}</div>
                <div class="summary-line">
                  <span>Electric</span>
                  <strong>₱ {{ electricAmount.toFixed(2) }}</strong>
                </div>
                <div class="summary-line">
                  <span>Water</span>
                  <strong>₱ {{ Number(form.water_rate || 0).toFixed(2) }}</strong>
                </div>
                <div class="summary-line">
                  <span>Wifi</span>
                  <strong>₱ {{ Number(form.wifi_rate || 0).toFixed(2) }}</strong>
                </div>
                <div class="summary-total">Total Bill: ₱ {{ totalAmount.toFixed(2) }}</div>
              </v-card-text>
            </v-card>

            <v-btn
              type="submit"
              color="primary"
              class="mt-4"
              block
            >
              Save Record
            </v-btn>
          </v-form>
        </v-card-text>
      </v-card>
    </v-container>
  </v-app>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import {
  getApartments,
  getDueDate,
  getLatestRoomRecord,
  getMeterRecords,
  getWaterRate,
  getWifiRate,
  setMeterRecords
} from '../utils/storage'

const apartments = computed(() => getApartments())

const apartmentNames = computed(() => apartments.value.map(apartment => apartment.name))

const roomOptions = computed(() => {
  if (!form.value.apartment) return []

  const apartment = apartments.value.find(item => item.name === form.value.apartment)
  return apartment ? apartment.rooms : []
})

const createDefaultForm = () => ({
  apartment: '',
  room: null,
  tenant: '',
  date: new Date().toISOString().slice(0, 10),
  kwh_rate: 12.16,
  prev_reading: 0,
  current_reading: null,
  wifi_rate: 0,
  water_rate: 0
})

const form = ref(createDefaultForm())

const formatDueDate = (value) => {
  if (!value) return ''

  const [month, day] = value.split('-')
  if (!month || !day) return ''

  const parsed = new Date(`2000-${month}-${day}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return ''

  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric'
  })
}

const dueDateDisplay = computed(() => (
  formatDueDate(getDueDate(form.value.apartment, form.value.room))
))

const resetForm = () => {
  form.value = createDefaultForm()
}

const hydrateRoomRates = () => {
  form.value.wifi_rate = getWifiRate(form.value.apartment, form.value.room)
  form.value.water_rate = getWaterRate(form.value.apartment, form.value.room)
}

const loadPreviousReading = () => {
  const latestRecord = getLatestRoomRecord(form.value.apartment, form.value.room)

  hydrateRoomRates()

  if (!latestRecord) {
    form.value.tenant = ''
    form.value.prev_reading = 0
    return
  }

  form.value.tenant = latestRecord.tenant ?? ''
  form.value.prev_reading = Number(latestRecord.current_reading) || 0
}

watch(
  () => form.value.apartment,
  () => {
    form.value.room = null
    form.value.tenant = ''
    form.value.prev_reading = 0
    form.value.current_reading = null
    hydrateRoomRates()
  }
)

watch(
  () => [form.value.apartment, form.value.room],
  ([apartment, room]) => {
    if (!apartment || !room) {
      hydrateRoomRates()
      return
    }

    loadPreviousReading()
  }
)

const electricAmount = computed(() => {
  if (form.value.prev_reading == null || form.value.current_reading == null) return 0

  return (
    (Number(form.value.current_reading) - Number(form.value.prev_reading)) *
    Number(form.value.kwh_rate || 0)
  )
})

const totalAmount = computed(() => (
  electricAmount.value +
  Number(form.value.wifi_rate || 0) +
  Number(form.value.water_rate || 0)
))

const submit = () => {
  const stored = getMeterRecords()

  let apartment = stored.find(item => item.apartment === form.value.apartment)

  if (!apartment) {
    apartment = {
      apartment: form.value.apartment,
      rooms: []
    }
    stored.push(apartment)
  }

  let room = apartment.rooms.find(item => item.room === form.value.room)

  if (!room) {
    room = {
      room: form.value.room,
      records: []
    }
    apartment.rooms.push(room)
  }

  room.records.push({
    tenant: form.value.tenant,
    date: form.value.date,
    current_reading: Number(form.value.current_reading),
    prev_reading: Number(form.value.prev_reading),
    kwh_rate: Number(form.value.kwh_rate || 0),
    electric_amount: Number(electricAmount.value.toFixed(2)),
    wifi_rate: Number(form.value.wifi_rate || 0),
    water_rate: Number(form.value.water_rate || 0),
    total_amount: Number(totalAmount.value.toFixed(2))
  })

  setMeterRecords(stored)
  alert('Saved successfully')
  resetForm()
}
</script>

<style scoped>
.summary-card {
  border: 1px solid rgba(251, 192, 45, 0.35);
}

.summary-card :deep(.v-card-text) {
  color: #111111 !important;
}

.summary-card :deep(.v-card-text strong),
.summary-card :deep(.v-card-text span),
.summary-card :deep(.v-card-text div) {
  color: #111111 !important;
}

.summary-label {
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  margin-top: 10px;
}

.summary-total {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1.1;
  margin-top: 16px;
}

.due-date-text {
  margin-top: -8px;
  margin-bottom: 16px;
  color: rgba(0, 0, 0, 0.7);
  font-size: 0.95rem;
  font-weight: 600;
}
</style>
