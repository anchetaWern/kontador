<template>
  <v-container>
    <!-- Export Section -->
    <v-row>
      <v-col cols="12">
        <v-card outlined>
          <v-card-title>Export All Data</v-card-title>
          <v-card-text>
            <v-textarea
              v-model="exportText"
              rows="15"
              readonly
              outlined
            ></v-textarea>
          </v-card-text>
          <v-card-actions>
            <v-btn color="yellow darken-2" @click="copyToClipboard">
              Copy to Clipboard
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Import Section -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card outlined>
          <v-card-title>Import All Data</v-card-title>
          <v-card-text>
            <v-textarea
              v-model="importText"
              rows="15"
              outlined
              placeholder="Paste JSON here"
            ></v-textarea>
          </v-card-text>
          <v-card-actions>
            <v-btn color="yellow darken-2" @click="importData">
              Import
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const exportText = ref('')
const importText = ref('')

const loadAllData = () => {
  const apartments = JSON.parse(localStorage.getItem('apartments') || '[]')
  const meterRecords = JSON.parse(localStorage.getItem('meterRecords') || '[]')

  // Prepare latest records for each room
  const latestMeterRecords = meterRecords.map(apartment => {
    const rooms = apartment.rooms.map(r => {
      const latestRecord = r.records.length ? r.records[r.records.length - 1] : null
      return {
        room: r.room,
        records: latestRecord ? [latestRecord] : []
      }
    })
    return {
      apartment: apartment.apartment,
      rooms
    }
  })

  exportText.value = JSON.stringify({
    apartments,
    meterRecords: latestMeterRecords
  }, null, 2)
}

const copyToClipboard = () => {
  navigator.clipboard.writeText(exportText.value)
  alert('Copied to clipboard!')
}

const importData = () => {
  try {
    const parsed = JSON.parse(importText.value)
    if (parsed.apartments) {
      localStorage.setItem('apartments', JSON.stringify(parsed.apartments))
    }
    if (parsed.meterRecords) {
      localStorage.setItem('meterRecords', JSON.stringify(parsed.meterRecords))
    }
    alert('Data imported successfully!')
    loadAllData() // refresh export
  } catch (err) {
    alert('Invalid JSON!')
    console.error(err)
  }
}

onMounted(() => {
  loadAllData()
})
</script>
