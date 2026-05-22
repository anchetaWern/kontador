<template>
  <v-container class="pa-6" max-width="600">
    <v-card>
      <v-card-title>Wifi Rate</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="saveRate">
          <v-text-field
            v-model.number="wifiRate"
            label="Global Wifi Rate"
            type="number"
            step="0.01"
            min="0"
            required
          />

          <v-btn type="submit" color="primary" class="mt-4">
            Save Wifi Rate
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { getWifiRate, setWifiRate } from '../utils/storage'

const wifiRate = ref(getWifiRate().amount)

const saveRate = () => {
  setWifiRate(wifiRate.value)
  alert('Wifi rate saved!')
}
</script>
