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
import { exportAppData, importAppData } from '../utils/storage'

const exportText = ref('')
const importText = ref('')

const loadAllData = () => {
  exportText.value = JSON.stringify(exportAppData(), null, 2)
}

const copyToClipboard = () => {
  navigator.clipboard.writeText(exportText.value)
  alert('Copied to clipboard!')
}

const importData = () => {
  try {
    const parsed = JSON.parse(importText.value)
    importAppData(parsed)
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
