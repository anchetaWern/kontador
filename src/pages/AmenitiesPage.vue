<template>
  <v-container class="pa-6" max-width="600">
    <v-card>
      <v-card-title>Amenities</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="saveAmenities">
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

          <v-textarea
            v-model="amenities"
            label="Amenities"
            placeholder="e.g. table, chairs, foam, electric fan"
            rows="6"
            auto-grow
            required
          />

          <v-btn type="submit" color="primary" class="mt-4">
            Save Amenities
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { getApartments, getRoomAmenities, setRoomAmenities } from '../utils/storage'

const apartments = ref(getApartments())
const selectedApartment = ref('')
const selectedRoom = ref('')
const amenities = ref('')

const apartmentNames = computed(() => apartments.value.map(apartment => apartment.name))

const roomOptions = computed(() => {
  const apartment = apartments.value.find(item => item.name === selectedApartment.value)
  return apartment?.rooms ?? []
})

watch(selectedApartment, () => {
  selectedRoom.value = ''
  amenities.value = ''
})

watch(selectedRoom, () => {
  amenities.value = getRoomAmenities(selectedApartment.value, selectedRoom.value)
})

const saveAmenities = () => {
  if (!selectedApartment.value || !selectedRoom.value) {
    alert('Select apartment and room')
    return
  }

  setRoomAmenities(selectedApartment.value, selectedRoom.value, amenities.value)
  amenities.value = getRoomAmenities(selectedApartment.value, selectedRoom.value)
  alert('Amenities saved!')
}
</script>
