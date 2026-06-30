<template>
  <v-container class="pa-6 dashboard-page">
    <v-card class="dashboard-shell" rounded="xl">
      <v-card-text class="pa-5 pa-sm-6">
      

        <v-select
          v-model="selectedApartment"
          label="Apartment"
          :items="apartmentNames"
          class="mt-4"
          hide-details
        />

        <v-alert
          v-if="!apartmentNames.length"
          type="info"
          variant="tonal"
          class="mt-4"
        >
          Add an apartment first in Apartment Setup to start using the dashboard.
        </v-alert>

        <v-alert
          v-else-if="!selectedApartment"
          type="info"
          variant="tonal"
          class="mt-4"
        >
          Select an apartment to view this month’s room status.
        </v-alert>

        <div v-else class="room-grid mt-6">
          <v-card
            v-for="room in roomSummaries"
            :key="room.room"
            class="room-card"
            rounded="xl"
            variant="outlined"
          >
            <v-card-text>
              <div class="room-topline">
                <div>
                  <div class="room-label">Room</div>
                  <div class="room-value">{{ room.room }}</div>
                </div>

                <div
                  class="bill-badge"
                  :class="{ 'bill-badge--missing': !room.hasCurrentMonthBill }"
                >
                  {{ room.hasCurrentMonthBill ? 'Bill Entered' : 'No Bill Yet' }}
                </div>
              </div>

              <div class="info-row">
                <span>Tenant</span>
                <strong>{{ room.tenant || 'No tenant yet' }}</strong>
              </div>

              <div class="info-row">
                <span>Due Date</span>
                <strong>{{ room.dueDateDisplay }}</strong>
              </div>

              <div class="info-row">
                <span>Total Bill</span>
                <strong v-if="room.hasCurrentMonthBill" class="bill-total">
                  ₱ {{ room.totalBillDisplay }}
                </strong>
                <strong v-else class="text-medium-emphasis">Not entered yet</strong>
              </div>

              <div class="info-row">
                <span>Electric</span>
                <strong v-if="room.hasCurrentMonthBill" class="bill-total">
                  ₱ {{ room.electricBillDisplay }}
                </strong>
                <strong v-else class="text-medium-emphasis">Not entered yet</strong>
              </div>

              <div class="info-row">
                <span>Wifi</span>
                <strong v-if="room.hasCurrentMonthBill" class="bill-total">
                  ₱ {{ room.wifiBillDisplay }}
                </strong>
                <strong v-else class="text-medium-emphasis">Not entered yet</strong>
              </div>

              <div class="info-row">
                <span>Water</span>
                <strong v-if="room.hasCurrentMonthBill" class="bill-total">
                  ₱ {{ room.waterBillDisplay }}
                </strong>
                <strong v-else class="text-medium-emphasis">Not entered yet</strong>
              </div>

              <div v-if="room.resetDateLabel" class="reset-note">
                Resets to not paid on {{ room.resetDateLabel }}.
              </div>

              <v-btn
                block
                class="mt-4 payment-button"
                :color="room.paid ? 'success' : 'error'"
                @click="togglePaid(room)"
              >
                {{ room.paid ? 'Paid' : 'Not Paid' }}
              </v-btn>
            </v-card-text>
          </v-card>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import {
  getApartments,
  getElectricAmount,
  getEffectiveCurrentMonthPaymentStatus,
  getCurrentMonthKey,
  getCurrentMonthRoomRecord,
  getDueDate,
  getLatestRoomRecord,
  getTotalAmount,
  setCurrentMonthPaymentStatus
} from '../utils/storage'

const refreshKey = ref(0)
const selectedApartment = ref('')

const apartments = computed(() => {
  refreshKey.value
  return getApartments()
})

const apartmentNames = computed(() => apartments.value.map(apartment => apartment.name))

watch(
  apartmentNames,
  (names) => {
    if (!names.length) {
      selectedApartment.value = ''
      return
    }

    if (!names.includes(selectedApartment.value)) {
      selectedApartment.value = names[0]
    }
  },
  { immediate: true }
)

const monthLabel = computed(() => {
  const today = new Date()

  return today.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })
})

const formatDueDate = (value) => {
  if (!value) return 'No due date set'

  const [month, day] = value.split('-')
  if (!month || !day) return 'No due date set'

  const parsed = new Date(`2000-${month}-${day}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return 'No due date set'

  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric'
  })
}

const formatCurrencyAmount = (value) => Number(value || 0).toFixed(2)

const getResetDateLabel = (dueDate) => {
  if (!dueDate) return ''

  const [month, day] = dueDate.split('-').map(Number)
  if (!month || !day) return ''

  const currentYear = new Date().getFullYear()
  const dueDateThisYear = new Date(currentYear, month - 1, day)
  if (Number.isNaN(dueDateThisYear.getTime())) return ''

  dueDateThisYear.setDate(dueDateThisYear.getDate() - 7)

  return dueDateThisYear.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric'
  })
}

const roomSummaries = computed(() => {
  refreshKey.value

  if (!selectedApartment.value) return []

  const apartment = apartments.value.find(item => item.name === selectedApartment.value)
  if (!apartment) return []

  const currentMonth = getCurrentMonthKey()

  return apartment.rooms
    .map(roomName => {
      const latestRecord = getLatestRoomRecord(selectedApartment.value, roomName)
      const currentMonthRecord = getCurrentMonthRoomRecord(
        selectedApartment.value,
        roomName,
        currentMonth
      )
      const dueDate = getDueDate(selectedApartment.value, roomName)

      return {
        room: roomName,
        tenant: latestRecord?.tenant ?? '',
        dueDateDisplay: formatDueDate(dueDate),
        resetDateLabel: getResetDateLabel(dueDate),
        hasCurrentMonthBill: Boolean(currentMonthRecord),
        totalBillDisplay: currentMonthRecord
          ? formatCurrencyAmount(getTotalAmount(currentMonthRecord))
          : '0.00',
        electricBillDisplay: currentMonthRecord
          ? formatCurrencyAmount(getElectricAmount(currentMonthRecord))
          : '0.00',
        wifiBillDisplay: currentMonthRecord
          ? formatCurrencyAmount(currentMonthRecord.wifi_rate)
          : '0.00',
        waterBillDisplay: currentMonthRecord
          ? formatCurrencyAmount(currentMonthRecord.water_rate)
          : '0.00',
        paid: getEffectiveCurrentMonthPaymentStatus(
          selectedApartment.value,
          roomName,
          dueDate
        )
      }
    })
    .sort((first, second) => first.room.localeCompare(second.room, undefined, { numeric: true }))
})

const togglePaid = (room) => {
  setCurrentMonthPaymentStatus(selectedApartment.value, room.room, !room.paid)
  refreshKey.value += 1
}
</script>

<style scoped>
.dashboard-page {
  max-width: 1100px;
}

.dashboard-shell {
  background:
    radial-gradient(circle at top right, rgba(251, 192, 45, 0.22), transparent 28%),
    linear-gradient(180deg, #fffdf3 0%, #ffffff 100%);
  border: 1px solid rgba(251, 192, 45, 0.22);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.dashboard-eyebrow {
  color: #8b6b00;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.dashboard-title {
  margin: 8px 0 4px;
  font-size: clamp(1.75rem, 3vw, 2.6rem);
  line-height: 1.05;
}

.dashboard-subtitle {
  margin: 0;
  max-width: 620px;
  color: rgba(0, 0, 0, 0.68);
}

.month-pill {
  border-radius: 999px;
  background: #111111;
  color: #fff8d6;
  padding: 10px 14px;
  font-size: 0.9rem;
  font-weight: 700;
  white-space: nowrap;
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.room-card {
  border-color: rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.92);
}

.room-topline {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.room-label {
  color: rgba(0, 0, 0, 0.48);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.room-value {
  font-size: 1.7rem;
  font-weight: 800;
  line-height: 1.1;
}

.bill-badge {
  border-radius: 999px;
  background: #e8f5e9;
  color: #1b5e20;
  padding: 6px 10px;
  font-size: 0.75rem;
  font-weight: 700;
}

.bill-badge--missing {
  background: #fff3e0;
  color: #e65100;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-top: 16px;
}

.info-row span {
  color: rgba(0, 0, 0, 0.62);
}

.bill-total {
  font-size: 1.1rem;
}

.reset-note {
  margin-top: 14px;
  color: rgba(0, 0, 0, 0.58);
  font-size: 0.86rem;
}

.payment-button {
  font-weight: 800;
  letter-spacing: 0.04em;
}

@media (max-width: 640px) {
  .dashboard-header {
    flex-direction: column;
  }

  .month-pill {
    align-self: flex-start;
  }
}
</style>
