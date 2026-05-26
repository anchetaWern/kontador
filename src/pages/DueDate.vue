<template>
  <v-container class="pa-6" max-width="600">
    <v-card>
      <v-card-title>Due Date</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="saveDueDate">
          <v-select
            v-model="selectedApartment"
            label="Apartment"
            :items="apartmentNames"
            required
          />

          <v-select
            v-model="selectedRoom"
            label="Room"
            :items="roomOptions"
            :disabled="!selectedApartment"
            required
          />

          <v-text-field
            v-model="dueDate"
            label="Due Date"
            placeholder="MM-DD (e.g. 01-25)"
            required
          />

          <div v-if="displayDueDate" class="text-medium-emphasis text-body-2 mt-2">
            Saved format preview: {{ displayDueDate }}
          </div>

          <v-btn type="submit" color="primary" class="mt-4">
            Save Due Date
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { getApartments, getDueDate, setDueDate } from '../utils/storage'

const DISPLAY_YEAR = '2000'

const apartments = ref(getApartments())
const selectedApartment = ref('')
const selectedRoom = ref('')
const dueDate = ref('')

const apartmentNames = computed(() => apartments.value.map(apartment => apartment.name))

const roomOptions = computed(() => {
  const apartment = apartments.value.find(item => item.name === selectedApartment.value)
  return apartment?.rooms ?? []
})

const formatDueDate = (value) => {
  if (!value) return ''

  const [month, day] = value.split('-')
  if (!month || !day) return ''

  const parsed = new Date(`${DISPLAY_YEAR}-${month}-${day}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return ''

  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric'
  })
}

const displayDueDate = computed(() => formatDueDate(dueDate.value))

watch(selectedApartment, () => {
  selectedRoom.value = ''
  dueDate.value = ''
})

watch(selectedRoom, () => {
  dueDate.value = getDueDate(selectedApartment.value, selectedRoom.value)
})

const saveDueDate = () => {
  const normalizedDueDate = dueDate.value.trim()

  if (!selectedApartment.value || !selectedRoom.value || !normalizedDueDate) {
    alert('Select apartment, room, and due date')
    return
  }

  if (!/^\d{2}-\d{2}$/.test(normalizedDueDate)) {
    alert('Use MM-DD format, for example 01-25')
    return
  }

  setDueDate(selectedApartment.value, selectedRoom.value, normalizedDueDate)
  dueDate.value = getDueDate(selectedApartment.value, selectedRoom.value)
  alert('Due date saved!')
}
</script>
