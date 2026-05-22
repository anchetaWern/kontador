const APARTMENTS_KEY = 'apartments'
const METER_RECORDS_KEY = 'meterRecords'
const WIFI_RATE_KEY = 'wifiRate'
const WATER_RATES_KEY = 'waterRates'

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

export const getWifiRate = () => {
  const stored = readJson(WIFI_RATE_KEY, { amount: 0 })
  return { amount: toNumber(stored?.amount) }
}

export const setWifiRate = (amount) => {
  writeJson(WIFI_RATE_KEY, { amount: toNumber(amount) })
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

export const getLatestRoomRecord = (apartmentName, roomName) => {
  if (!apartmentName || !roomName) return null

  const apartment = getMeterRecords().find(item => item.apartment === apartmentName)
  const room = apartment?.rooms?.find(item => item.room === roomName)

  if (!room?.records?.length) return null

  return room.records[room.records.length - 1]
}

export const buildLatestMeterRecords = () => (
  getMeterRecords().map(apartment => ({
    apartment: apartment.apartment,
    rooms: apartment.rooms.map(room => {
      const latestRecord = room.records?.length
        ? room.records[room.records.length - 1]
        : null

      return {
        room: room.room,
        records: latestRecord ? [latestRecord] : []
      }
    })
  }))
)

export const exportAppData = () => ({
  apartments: getApartments(),
  meterRecords: buildLatestMeterRecords(),
  wifiRate: getWifiRate(),
  waterRates: getWaterRates()
})

export const importAppData = (data) => {
  setApartments(Array.isArray(data?.apartments) ? data.apartments : [])
  setMeterRecords(Array.isArray(data?.meterRecords) ? data.meterRecords : [])
  setWifiRate(data?.wifiRate?.amount ?? 0)
  setWaterRates(
    Array.isArray(data?.waterRates?.apartments)
      ? data.waterRates
      : { apartments: [] }
  )
}
