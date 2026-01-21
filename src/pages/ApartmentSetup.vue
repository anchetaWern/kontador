<template>
  <v-container class="pa-6" max-width="600">
    <v-card>
      <v-card-title>Apartment Setup</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="saveSetup">
          <v-text-field
            v-model="apartmentName"
            label="Apartment Name"
            required
          />

          <v-textarea
            v-model="roomsText"
            label="Room Names (comma-separated)"
            placeholder="Room1,Room2,Room3"
            required
            rows="3"
          />

          <v-btn type="submit" color="primary" class="mt-4">Save Apartment</v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'

const apartmentName = ref('')
const roomsText = ref('')

const saveSetup = () => {
  if (!apartmentName.value || !roomsText.value) return alert('Fill all fields')

  const rooms = roomsText.value.split(',').map(r => r.trim()).filter(r => r)
  if (rooms.length === 0) return alert('Add at least one room')

  const stored = JSON.parse(localStorage.getItem('apartments') || '[]')
  const existing = stored.find(a => a.name === apartmentName.value)

  if (existing) {
    existing.rooms = rooms
  } else {
    stored.push({ name: apartmentName.value, rooms })
  }

  localStorage.setItem('apartments', JSON.stringify(stored))
  alert('Apartment saved!')
  apartmentName.value = ''
  roomsText.value = ''
}
</script>
