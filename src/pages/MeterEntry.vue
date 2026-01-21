<template>
  <v-app>
    <v-container class="pa-6" max-width="600">
      <v-card>
        <v-card-title>Electric Meter Entry</v-card-title>
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
              required
            />

            <v-text-field
              v-model="form.tenant"
              label="Tenant Name"
              required
            />

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
            />

            <v-text-field
              v-model.number="form.prev_reading"
              label="Previous Reading"
              type="number"
              step="0.01"
              required
            />

            <v-text-field
              v-model.number="form.current_reading"
              label="Current Reading"
              type="number"
              step="0.01"
              required
            />

            <v-alert
              type="success"
              class="mt-3"
              v-if="pay > 0"
            >
              Amount to Pay: ₱ {{ pay.toFixed(2) }}
            </v-alert>

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
import { ref, computed, watch } from 'vue'

const apartmentNames = computed(() => {
  const stored = JSON.parse(localStorage.getItem('apartments') || '[]')
  return stored.map(a => a.name)
})

const roomOptions = computed(() => {
  if (!form.value.apartment) return []
  const stored = JSON.parse(localStorage.getItem('apartments') || '[]')
  const apartment = stored.find(a => a.name === form.value.apartment)
  return apartment ? apartment.rooms : []
})

const form = ref({
  apartment: '',
  room: null,
  tenant: '',
  date: new Date().toISOString().slice(0, 10),
  kwh_rate: 12.16,
  prev_reading: null,
  current_reading: null
})

const loadPreviousReading = () => {
  const stored = JSON.parse(localStorage.getItem('meterRecords') || '[]')

  const apartment = stored.find(
    a => a.apartment === form.value.apartment
  )

  if (!apartment) {
    form.value.prev_reading = 0
    return
  }

  const room = apartment.rooms.find(
    r => r.room === form.value.room
  )

  if (!room || room.records.length === 0) {
    form.value.prev_reading = 0
    return
  }

  const latestRecord = room.records[room.records.length - 1]

  form.value.tenant = latestRecord.tenant;
  form.value.prev_reading = latestRecord.current_reading
}

watch(
  () => [form.value.apartment, form.value.room],
  () => {
    loadPreviousReading()
  }
)

const pay = computed(() => {
  if (
    form.value.prev_reading == null ||
    form.value.current_reading == null
  ) return 0

  return (
    (form.value.current_reading - form.value.prev_reading) *
    form.value.kwh_rate
  )
})

const submit = () => {
  const stored = JSON.parse(localStorage.getItem('meterRecords') || '[]')

  let apartment = stored.find(
    a => a.apartment === form.value.apartment
  )

  if (!apartment) {
    apartment = {
      apartment: form.value.apartment,
      rooms: []
    }
    stored.push(apartment)
  }

  let room = apartment.rooms.find(
    r => r.room === form.value.room
  )

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
    current_reading: form.value.current_reading,
    prev_reading: form.value.prev_reading,
    kwh_rate: form.value.kwh_rate,
    pay: Number(pay.value.toFixed(2))
  })

  localStorage.setItem('meterRecords', JSON.stringify(stored))

  alert('Saved successfully')

  // reset readings only
  form.value.current_reading = null
}
</script>
