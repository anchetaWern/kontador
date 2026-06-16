<template>
  <v-container class="pa-6" max-width="700">
    <v-card>
      <v-card-title>Latest Meter Entries</v-card-title>
      <v-card-text>
        <v-select
          v-model="selectedApartment"
          label="Select Apartment"
          :items="apartmentNames"
        />

        <div v-if="records.length">
          <v-card
            v-for="record in records"
            :key="record.room"
            class="my-4"
            variant="outlined"
          >
            <v-card-text>
              <v-table density="compact">
                <tbody>
                  <tr>
                    <td class="col-name"><strong>Room</strong></td>
                    <td class="text-body-1 font-weight-bold">{{ record.room }}</td>
                  </tr>
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
                      <v-btn
                        size="small"
                        variant="text"
                        color="yellow-darken-2"
                        class="ml-2"
                        @click="copyAmount(record)"
                      >
                        Copy
                      </v-btn>
                      <v-btn
                        size="small"
                        variant="text"
                        color="primary"
                        class="ml-2"
                        :to="getHistoryLink(record.room)"
                      >
                        View history
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>
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
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getApartments,
  getElectricAmount,
  getMeterRecords,
  getTotalAmount
} from '../utils/storage'

const route = useRoute()
const router = useRouter()

const selectedApartment = ref(
  typeof route.query.apartment === 'string' ? route.query.apartment : ''
)

const apartmentNames = computed(() => getApartments().map(apartment => apartment.name))

watch(selectedApartment, (apartment) => {
  const currentApartment = typeof route.query.apartment === 'string' ? route.query.apartment : ''

  if (currentApartment === (apartment || '')) return

  router.replace({
    path: '/latest',
    query: apartment ? { apartment } : {}
  })
})

const records = computed(() => {
  if (!selectedApartment.value) return []

  const apartment = getMeterRecords().find(item => item.apartment === selectedApartment.value)
  if (!apartment) return []

  return apartment.rooms
    .map(room => {
      const latestRecord = room.records?.length
        ? room.records[room.records.length - 1]
        : null

      if (!latestRecord) return null

      return {
        room: room.room,
        tenant: latestRecord.tenant ?? '',
        date: latestRecord.date ?? '',
        prev_reading: latestRecord.prev_reading ?? 0,
        current_reading: latestRecord.current_reading ?? 0,
        kwh_rate: latestRecord.kwh_rate ?? 0,
        electric_amount: getElectricAmount(latestRecord),
        wifi_rate: Number(latestRecord.wifi_rate ?? 0),
        water_rate: Number(latestRecord.water_rate ?? 0),
        total_amount: getTotalAmount(latestRecord)
      }
    })
    .filter(Boolean)
    .sort((first, second) => new Date(second.date) - new Date(first.date))
})

const copyAmount = (record) => {
  const text = `${record.room}: ${record.tenant}: Total ₱${record.total_amount.toFixed(2)}. ` +
    `Electric ₱${record.electric_amount.toFixed(2)}, Wifi ₱${record.wifi_rate.toFixed(2)}, ` +
    `Water ₱${record.water_rate.toFixed(2)}. ` +
    `Break down: (${record.current_reading} - ${record.prev_reading}) * ${record.kwh_rate}`

  navigator.clipboard.writeText(text)
  alert('Copied to clipboard!')
}

const getHistoryLink = (room) => ({
  path: '/meter-history',
  query: {
    apartment: selectedApartment.value,
    room
  }
})
</script>

<style scoped>
.col-name {
  width: 150px;
  padding-right: 16px;
}
</style>
