<template>
  <v-container class="pa-6" max-width="600">
    <v-card>
      <v-card-title>Latest Meter Entries</v-card-title>
      <v-card-text>

        <!-- Apartment dropdown -->
        <v-select
          v-model="selectedApartment"
          label="Select Apartment"
          :items="apartmentNames"
        />

        <!-- Records -->
        <div v-if="records.length">
          <v-card
            v-for="(record, index) in records"
            :key="index"
            class="my-4"
            outlined
          >
            <v-card-text>
              <v-simple-table dense>
                <tbody>
                  <tr>
                    <td class="col-name"><strong>Room</strong></td>
                    <td>{{ record.room }}</td>
                  </tr>
                  <tr>
                    <td class="col-name"><strong>Date</strong></td>
                    <td>{{ record.date }}</td>
                  </tr>
                  <tr>
                    <td class="col-name"><strong>Previous Reading</strong></td>
                    <td>{{ record.prev_reading }}</td>
                  </tr>
                  <tr>
                    <td class="col-name"><strong>Current Reading</strong></td>
                    <td>{{ record.current_reading }}</td>
                  </tr>
                  <tr>
                    <td class="col-name"><strong>kWh Rate</strong></td>
                    <td>{{ record.kwh_rate }}</td>
                  </tr>
                  <tr>
                    <td class="col-name"><strong>Amount (₱)</strong></td>
                    <td>{{ record.pay.toFixed(2) }}</td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-card-text>
          </v-card>
        </div>

        <v-alert v-else type="info" class="mt-4">
          No records found for this apartment.
        </v-alert>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'

const selectedApartment = ref('')

const apartmentNames = computed(() => {
  const stored = JSON.parse(localStorage.getItem('apartments') || '[]')
  return stored.map(a => a.name)
})

// Flatten all records for the selected apartment
const records = computed(() => {
  if (!selectedApartment.value) return []

  const storedRecords = JSON.parse(localStorage.getItem('meterRecords') || '[]')
  const apartment = storedRecords.find(a => a.apartment === selectedApartment.value)
  if (!apartment) return []

  return apartment.rooms.flatMap(room =>
    room.records.map(rec => ({
      room: room.room,
      date: rec.date,
      prev_reading: rec.prev_reading,
      current_reading: rec.current_reading,
      kwh_rate: rec.kwh_rate,
      pay: rec.pay
    }))
  ).sort((a,b) => new Date(b.date) - new Date(a.date))
})
</script>

<style scoped>
.col-name {
  width: 150px; /* fixed width for left column */
  padding-right: 16px; /* spacing between name and value */
}
</style>
