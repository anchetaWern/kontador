<template>
  <v-container class="pa-6" max-width="600">
    <v-card>
      <v-card-title>Water Rate</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="saveRate">
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
            v-model.number="waterRate"
            label="Water Rate"
            type="number"
            step="0.01"
            min="0"
            required
          />

          <v-btn type="submit" color="primary" class="mt-4">
            Save Water Rate
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { getApartments, getWaterRate, setWaterRate } from '../utils/storage'

const apartments = ref(getApartments())
const selectedApartment = ref('')
const selectedRoom = ref('')
const waterRate = ref(0)

const apartmentNames = computed(() => apartments.value.map(apartment => apartment.name))

const roomOptions = computed(() => {
  const apartment = apartments.value.find(item => item.name === selectedApartment.value)
  return apartment?.rooms ?? []
})

watch(selectedApartment, () => {
  selectedRoom.value = ''
  waterRate.value = 0
})

watch(selectedRoom, () => {
  waterRate.value = getWaterRate(selectedApartment.value, selectedRoom.value)
})

const saveRate = () => {
  if (!selectedApartment.value || !selectedRoom.value) {
    alert('Select apartment and room')
    return
  }

  setWaterRate(selectedApartment.value, selectedRoom.value, waterRate.value)
  alert('Water rate saved!')
}
</script>
