const APARTMENTS_KEY = 'apartments'
const METER_RECORDS_KEY = 'meterRecords'
const WIFI_RATE_KEY = 'wifiRate'
const WIFI_RATES_KEY = 'wifiRates'
const WATER_RATES_KEY = 'waterRates'
const DUE_DATES_KEY = 'dueDates'
const CURRENT_MONTH_PAYMENTS_KEY = 'currentMonthPayments'
const MAINTENANCE_HISTORY_KEY = 'maintenanceHistory'

const readJson = (key, fallback) => {
  try {
    const rawValue = localStorage.getItem(key)
    return rawValue ? JSON.parse(rawValue) : fallback
  } catch (error) {
    console.error(`Failed to parse localStorage key "${key}"`, error)
    return fallback
  }
}

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
}

const toNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const normalizeDueDateValue = (value) => {
  if (typeof value !== 'string') return ''

  const trimmed = value.trim()
  if (!trimmed) return ''

  const monthDayMatch = trimmed.match(/^(\d{2})-(\d{2})$/)
  if (monthDayMatch) return `${monthDayMatch[1]}-${monthDayMatch[2]}`

  const isoDateMatch = trimmed.match(/^\d{4}-(\d{2})-(\d{2})$/)
  if (isoDateMatch) return `${isoDateMatch[1]}-${isoDateMatch[2]}`

  return ''
}

const buildCurrentMonthPaymentRoomKey = (apartmentName, roomName) => `${apartmentName}::${roomName}`
const MAINTENANCE_TYPES = ['aircon', 'water', 'painting', 'cleaning', 'toilet']

export const getCurrentMonthKey = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

const normalizeCurrentMonthPayments = (value, month = getCurrentMonthKey()) => {
  const rooms = (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value.rooms) &&
    value.rooms != null
  )
    ? Object.fromEntries(
        Object.entries(value.rooms).map(([roomKey, entry]) => {
          if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
            return [roomKey, {
              paid: Boolean(entry.paid),
              updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : ''
            }]
          }

          return [roomKey, {
            paid: Boolean(entry),
            updatedAt: ''
          }]
        })
      )
    : {}

  if (value?.month !== month) {
    return {
      month,
      rooms: {}
    }
  }

  return {
    month,
    rooms
  }
}

const normalizeMaintenanceDate = (value) => {
  if (typeof value !== 'string') return ''

  const trimmed = value.trim()
  if (!trimmed) return ''

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return ''

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const normalizeMaintenanceEntries = (entries) => (
  Array.isArray(entries)
    ? entries
        .map(entry => ({
          date: normalizeMaintenanceDate(entry?.date),
          createdAt: typeof entry?.createdAt === 'string' ? entry.createdAt : ''
        }))
        .filter(entry => entry.date)
        .sort((first, second) => new Date(second.date) - new Date(first.date))
    : []
)

const normalizeMaintenanceHistory = (value) => ({
  apartments: Array.isArray(value?.apartments)
    ? value.apartments.map(apartment => ({
        apartment: apartment?.apartment ?? '',
        rooms: Array.isArray(apartment?.rooms)
          ? apartment.rooms.map(room => {
              const normalizedHistory = Object.fromEntries(
                MAINTENANCE_TYPES.map(type => [
                  type,
                  normalizeMaintenanceEntries(room?.history?.[type])
                ])
              )

              return {
                room: room?.room ?? '',
                history: normalizedHistory
              }
            })
          : []
      }))
    : []
})

const getRecordMonthKey = (record = {}) => {
  if (typeof record.date !== 'string') return ''
  return record.date.slice(0, 7)
}

const getCurrentMonthResetDate = (dueDate, now = new Date()) => {
  if (typeof dueDate !== 'string') return null

  const [month, day] = dueDate.split('-').map(Number)
  if (!month || !day) return null

  const resetDate = new Date(now.getFullYear(), month - 1, day)
  if (Number.isNaN(resetDate.getTime())) return null

  resetDate.setDate(resetDate.getDate() - 7)
  resetDate.setHours(0, 0, 0, 0)

  return resetDate
}

export const getElectricAmount = (record = {}) => {
  if (record.electric_amount != null) return toNumber(record.electric_amount)
  if (record.pay != null) return toNumber(record.pay)

  return (
    toNumber(record.current_reading) - toNumber(record.prev_reading)
  ) * toNumber(record.kwh_rate)
}

export const getTotalAmount = (record = {}) => {
  if (record.total_amount != null) return toNumber(record.total_amount)

  return (
    getElectricAmount(record) +
    toNumber(record.wifi_rate) +
    toNumber(record.water_rate)
  )
}

export const normalizeRecord = (record = {}) => ({
  ...record,
  tenant: record.tenant ?? '',
  date: record.date ?? '',
  prev_reading: toNumber(record.prev_reading),
  current_reading: toNumber(record.current_reading),
  kwh_rate: toNumber(record.kwh_rate),
  electric_amount: Number(getElectricAmount(record).toFixed(2)),
  wifi_rate: toNumber(record.wifi_rate),
  water_rate: toNumber(record.water_rate),
  total_amount: Number(getTotalAmount(record).toFixed(2))
})

const normalizeMeterRecords = (meterRecords) => (
  Array.isArray(meterRecords)
    ? meterRecords.map(apartment => ({
        apartment: apartment?.apartment ?? '',
        rooms: Array.isArray(apartment?.rooms)
          ? apartment.rooms.map(room => ({
              room: room?.room ?? '',
              records: Array.isArray(room?.records)
                ? room.records.map(record => normalizeRecord(record))
                : []
            }))
          : []
      }))
    : []
)

export const getApartments = () => readJson(APARTMENTS_KEY, [])

export const setApartments = (apartments) => {
  writeJson(APARTMENTS_KEY, apartments)
}

export const getMeterRecords = () => normalizeMeterRecords(readJson(METER_RECORDS_KEY, []))

export const setMeterRecords = (meterRecords) => {
  writeJson(METER_RECORDS_KEY, normalizeMeterRecords(meterRecords))
}

const getLegacyWifiRate = () => {
  const stored = readJson(WIFI_RATE_KEY, { amount: 0 })
  return { amount: toNumber(stored?.amount) }
}

export const getWifiRates = () => {
  const stored = readJson(WIFI_RATES_KEY, { apartments: [] })
  return {
    apartments: Array.isArray(stored?.apartments) ? stored.apartments : []
  }
}

export const setWifiRates = (wifiRates) => {
  writeJson(WIFI_RATES_KEY, wifiRates)
}

export const getWifiRate = (apartmentName, roomName) => {
  if (!apartmentName || !roomName) return 0

  const stored = getWifiRates()
  const apartment = stored.apartments.find(item => item.apartment === apartmentName)
  const room = apartment?.rooms?.find(item => item.room === roomName)

  if (room?.amount != null) return toNumber(room.amount)

  return getLegacyWifiRate().amount
}

export const setWifiRate = (apartmentName, roomName, amount) => {
  const stored = getWifiRates()
  let apartment = stored.apartments.find(item => item.apartment === apartmentName)

  if (!apartment) {
    apartment = {
      apartment: apartmentName,
      rooms: []
    }
    stored.apartments.push(apartment)
  }

  let room = apartment.rooms.find(item => item.room === roomName)

  if (!room) {
    room = {
      room: roomName,
      amount: 0
    }
    apartment.rooms.push(room)
  }

  room.amount = toNumber(amount)
  setWifiRates(stored)
}

export const getWaterRates = () => {
  const stored = readJson(WATER_RATES_KEY, { apartments: [] })
  return {
    apartments: Array.isArray(stored?.apartments) ? stored.apartments : []
  }
}

export const setWaterRates = (waterRates) => {
  writeJson(WATER_RATES_KEY, waterRates)
}

export const getWaterRate = (apartmentName, roomName) => {
  if (!apartmentName || !roomName) return 0

  const stored = getWaterRates()
  const apartment = stored.apartments.find(item => item.apartment === apartmentName)
  const room = apartment?.rooms?.find(item => item.room === roomName)

  return toNumber(room?.amount)
}

export const setWaterRate = (apartmentName, roomName, amount) => {
  const stored = getWaterRates()
  let apartment = stored.apartments.find(item => item.apartment === apartmentName)

  if (!apartment) {
    apartment = {
      apartment: apartmentName,
      rooms: []
    }
    stored.apartments.push(apartment)
  }

  let room = apartment.rooms.find(item => item.room === roomName)

  if (!room) {
    room = {
      room: roomName,
      amount: 0
    }
    apartment.rooms.push(room)
  }

  room.amount = toNumber(amount)
  setWaterRates(stored)
}

export const getDueDates = () => {
  const stored = readJson(DUE_DATES_KEY, { apartments: [] })
  return {
    apartments: Array.isArray(stored?.apartments) ? stored.apartments : []
  }
}

export const setDueDates = (dueDates) => {
  writeJson(DUE_DATES_KEY, dueDates)
}

export const getDueDate = (apartmentName, roomName) => {
  if (!apartmentName || !roomName) return ''

  const stored = getDueDates()
  const apartment = stored.apartments.find(item => item.apartment === apartmentName)
  const room = apartment?.rooms?.find(item => item.room === roomName)

  return normalizeDueDateValue(room?.dueDate)
}

export const setDueDate = (apartmentName, roomName, dueDate) => {
  const stored = getDueDates()
  let apartment = stored.apartments.find(item => item.apartment === apartmentName)

  if (!apartment) {
    apartment = {
      apartment: apartmentName,
      rooms: []
    }
    stored.apartments.push(apartment)
  }

  let room = apartment.rooms.find(item => item.room === roomName)

  if (!room) {
    room = {
      room: roomName,
      dueDate: ''
    }
    apartment.rooms.push(room)
  }

  room.dueDate = normalizeDueDateValue(dueDate)
  setDueDates(stored)
}

export const getLatestRoomRecord = (apartmentName, roomName) => {
  if (!apartmentName || !roomName) return null

  const apartment = getMeterRecords().find(item => item.apartment === apartmentName)
  const room = apartment?.rooms?.find(item => item.room === roomName)

  if (!room?.records?.length) return null

  return room.records[room.records.length - 1]
}

export const getCurrentMonthRoomRecord = (
  apartmentName,
  roomName,
  month = getCurrentMonthKey()
) => {
  if (!apartmentName || !roomName) return null

  const apartment = getMeterRecords().find(item => item.apartment === apartmentName)
  const room = apartment?.rooms?.find(item => item.room === roomName)
  const currentMonthRecords = room?.records?.filter(record => getRecordMonthKey(record) === month) ?? []

  if (!currentMonthRecords.length) return null

  return [...currentMonthRecords].sort((first, second) => (
    new Date(second.date) - new Date(first.date)
  ))[0]
}

export const getCurrentMonthPayments = () => (
  normalizeCurrentMonthPayments(readJson(CURRENT_MONTH_PAYMENTS_KEY, {}))
)

export const setCurrentMonthPayments = (payments) => {
  writeJson(CURRENT_MONTH_PAYMENTS_KEY, normalizeCurrentMonthPayments(payments))
}

export const getCurrentMonthPaymentStatus = (apartmentName, roomName) => {
  if (!apartmentName || !roomName) return false

  const payments = getCurrentMonthPayments()
  return Boolean(payments.rooms[buildCurrentMonthPaymentRoomKey(apartmentName, roomName)]?.paid)
}

export const getEffectiveCurrentMonthPaymentStatus = (
  apartmentName,
  roomName,
  dueDate,
  now = new Date()
) => {
  if (!apartmentName || !roomName) return false

  const payments = getCurrentMonthPayments()
  const entry = payments.rooms[buildCurrentMonthPaymentRoomKey(apartmentName, roomName)]

  if (!entry?.paid) return false
  if (!dueDate) return true

  const resetDate = getCurrentMonthResetDate(dueDate, now)
  if (!resetDate) return true
  if (now < resetDate) return true

  const updatedAt = entry.updatedAt ? new Date(entry.updatedAt) : null
  if (!updatedAt || Number.isNaN(updatedAt.getTime())) return false

  return updatedAt >= resetDate
}

export const setCurrentMonthPaymentStatus = (apartmentName, roomName, paid) => {
  if (!apartmentName || !roomName) return

  const payments = getCurrentMonthPayments()
  payments.rooms[buildCurrentMonthPaymentRoomKey(apartmentName, roomName)] = {
    paid: Boolean(paid),
    updatedAt: new Date().toISOString()
  }
  setCurrentMonthPayments(payments)
}

export const getMaintenanceHistory = () => (
  normalizeMaintenanceHistory(readJson(MAINTENANCE_HISTORY_KEY, { apartments: [] }))
)

export const setMaintenanceHistory = (maintenanceHistory) => {
  writeJson(MAINTENANCE_HISTORY_KEY, normalizeMaintenanceHistory(maintenanceHistory))
}

export const saveMaintenanceEntry = (apartmentName, roomName, maintenanceType, date) => {
  if (
    !apartmentName ||
    !roomName ||
    !MAINTENANCE_TYPES.includes(maintenanceType)
  ) {
    return
  }

  const normalizedDate = normalizeMaintenanceDate(date)
  if (!normalizedDate) return

  const stored = getMaintenanceHistory()
  let apartment = stored.apartments.find(item => item.apartment === apartmentName)

  if (!apartment) {
    apartment = {
      apartment: apartmentName,
      rooms: []
    }
    stored.apartments.push(apartment)
  }

  let room = apartment.rooms.find(item => item.room === roomName)

  if (!room) {
    room = {
      room: roomName,
      history: Object.fromEntries(MAINTENANCE_TYPES.map(type => [type, []]))
    }
    apartment.rooms.push(room)
  }

  room.history[maintenanceType] = normalizeMaintenanceEntries([
    ...(room.history[maintenanceType] ?? []),
    {
      date: normalizedDate,
      createdAt: new Date().toISOString()
    }
  ])

  setMaintenanceHistory(stored)
}

export const getLatestMaintenanceDate = (apartmentName, roomName, maintenanceType) => {
  if (
    !apartmentName ||
    !roomName ||
    !MAINTENANCE_TYPES.includes(maintenanceType)
  ) {
    return ''
  }

  const apartment = getMaintenanceHistory().apartments.find(item => item.apartment === apartmentName)
  const room = apartment?.rooms?.find(item => item.room === roomName)

  return room?.history?.[maintenanceType]?.[0]?.date ?? ''
}

export const exportAppData = () => ({
  apartments: getApartments(),
  meterRecords: getMeterRecords(),
  wifiRates: getWifiRates(),
  waterRates: getWaterRates(),
  dueDates: getDueDates(),
  currentMonthPayments: getCurrentMonthPayments(),
  maintenanceHistory: getMaintenanceHistory()
})

export const importAppData = (data) => {
  const apartments = Array.isArray(data?.apartments) ? data.apartments : []

  setApartments(apartments)
  setMeterRecords(Array.isArray(data?.meterRecords) ? data.meterRecords : [])

  if (Array.isArray(data?.wifiRates?.apartments)) {
    setWifiRates(data.wifiRates)
  } else if (data?.wifiRate?.amount != null) {
    const fallbackAmount = toNumber(data.wifiRate.amount)
    setWifiRates({
      apartments: apartments.map(apartment => ({
        apartment: apartment.name ?? '',
        rooms: Array.isArray(apartment.rooms)
          ? apartment.rooms.map(room => ({
              room,
              amount: fallbackAmount
            }))
          : []
      }))
    })
    writeJson(WIFI_RATE_KEY, { amount: fallbackAmount })
  } else {
    setWifiRates({ apartments: [] })
  }

  setWaterRates(
    Array.isArray(data?.waterRates?.apartments)
      ? data.waterRates
      : { apartments: [] }
  )

  setDueDates(
    Array.isArray(data?.dueDates?.apartments)
      ? {
          apartments: data.dueDates.apartments.map(apartment => ({
            apartment: apartment?.apartment ?? '',
            rooms: Array.isArray(apartment?.rooms)
              ? apartment.rooms.map(room => ({
                  room: room?.room ?? '',
                  dueDate: normalizeDueDateValue(room?.dueDate)
                }))
              : []
          }))
        }
      : { apartments: [] }
  )

  setCurrentMonthPayments(
    data?.currentMonthPayments
      ? data.currentMonthPayments
      : { month: getCurrentMonthKey(), rooms: {} }
  )

  setMaintenanceHistory(
    Array.isArray(data?.maintenanceHistory?.apartments)
      ? data.maintenanceHistory
      : { apartments: [] }
  )
}
