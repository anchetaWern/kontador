<template>
  <v-container class="pa-6" max-width="700">
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-3">
        <div>
          Meter Reading History
          <div class="history-subtitle">
            {{ apartmentName || 'No apartment selected' }}
            <span v-if="roomName"> • Room {{ roomName }}</span>
          </div>
        </div>

        <v-btn
          variant="text"
          color="primary"
          :to="backLink"
        >
          Back to Latest Entries
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-alert
          v-if="!apartmentName || !roomName"
          type="warning"
          variant="tonal"
        >
          Select a room from Latest Meter Entries to view its history.
        </v-alert>

        <div v-else-if="records.length">
          <v-card
            v-for="(record, index) in records"
            :key="`${record.date}-${record.current_reading}-${index}`"
            class="my-4"
            variant="outlined"
          >
            <v-card-text>
              <div class="entry-title">
                Entry {{ records.length - index }}
              </div>

              <v-table density="compact">
                <tbody>
                  <tr>
                    <td class="col-name"><strong>Tenant</strong></td>
                    <td>{{ record.tenant }}</td>
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
                    <td class="col-name"><strong>Electric (₱)</strong></td>
                    <td>{{ record.electric_amount.toFixed(2) }}</td>
                  </tr>
                  <tr>
                    <td class="col-name"><strong>Room Rate (₱)</strong></td>
                    <td>{{ record.room_rate.toFixed(2) }}</td>
                  </tr>
                  <tr>
                    <td class="col-name"><strong>Wifi Rate (₱)</strong></td>
                    <td>{{ record.wifi_rate.toFixed(2) }}</td>
                  </tr>
                  <tr>
                    <td class="col-name"><strong>Water Rate (₱)</strong></td>
                    <td>{{ record.water_rate.toFixed(2) }}</td>
                  </tr>
                  <tr>
                    <td class="col-name"><strong>Total (₱)</strong></td>
                    <td>
                      <mark class="text-body-1 font-weight-bold">{{ record.total_amount.toFixed(2) }}</mark>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </div>

        <v-alert
          v-else
          type="info"
          class="mt-4"
        >
          No history found for this room.
        </v-alert>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getMeterRecords } from '../utils/storage'

const route = useRoute()

const apartmentName = computed(() => (
  typeof route.query.apartment === 'string' ? route.query.apartment : ''
))

const roomName = computed(() => (
  typeof route.query.room === 'string' ? route.query.room : ''
))

const backLink = computed(() => ({
  path: '/latest',
  query: apartmentName.value ? { apartment: apartmentName.value } : {}
}))

const records = computed(() => {
  if (!apartmentName.value || !roomName.value) return []

  const apartment = getMeterRecords().find(item => item.apartment === apartmentName.value)
  const room = apartment?.rooms?.find(item => item.room === roomName.value)

  if (!room?.records?.length) return []

  return [...room.records].sort((first, second) => new Date(second.date) - new Date(first.date))
})
</script>

<style scoped>
.history-subtitle {
  color: rgba(0, 0, 0, 0.65);
  font-size: 0.95rem;
  font-weight: 500;
  margin-top: 4px;
}

.entry-title {
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.col-name {
  width: 150px;
  padding-right: 16px;
}
</style>
