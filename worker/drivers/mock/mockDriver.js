const fallbackOnus = [
  { serial_number: 'ZTEG8A23F019', pon_port: 'gpon-olt_1/1/1', onu_id: 4, rx_signal: -20.7, tx_signal: 2.1, distance_meters: 820, status: 'online' },
  { serial_number: 'HWTC9C72A551', pon_port: '0/1/0', onu_id: 17, rx_signal: -24.9, tx_signal: 2.6, distance_meters: 1620, status: 'online' },
  { serial_number: 'BDCM0019AD77', pon_port: 'EPON0/1', onu_id: 8, rx_signal: -31.6, tx_signal: 3.4, distance_meters: 2390, status: 'offline' },
  { serial_number: 'VSOL00C82D10', pon_port: '0/1/1', onu_id: 22, rx_signal: -27.8, tx_signal: 2.9, distance_meters: 2010, status: 'online' },
  { serial_number: 'ZTEG8A23F104', pon_port: 'gpon-olt_1/1/2', onu_id: 13, rx_signal: -18.5, tx_signal: 1.8, distance_meters: 540, status: 'online' },
]

function jitter(value, amount) {
  return Number((Number(value) + (Math.random() * amount * 2 - amount)).toFixed(2))
}

function pollOlt(olt, existingOnus) {
  const source = existingOnus.length ? existingOnus : fallbackOnus.filter((onu) => onu.serial_number.startsWith(olt.vendor.slice(0, 2).toUpperCase()))
  const onus = source.map((onu) => {
    const randomLoss = Math.random() < 0.04
    const randomRestore = onu.status === 'offline' && Math.random() < 0.15
    const status = randomLoss ? 'offline' : randomRestore ? 'online' : onu.status

    return {
      serialNumber: onu.serial_number,
      clientId: onu.client_id || null,
      oltId: olt.id,
      ponPort: onu.pon_port,
      onuId: Number(onu.onu_id || 0),
      rxSignal: jitter(onu.rx_signal || -22, 0.7),
      txSignal: jitter(onu.tx_signal || 2.3, 0.2),
      distanceMeters: Number(onu.distance_meters || 900),
      status,
    }
  })

  if (Math.random() < 0.12) {
    onus.push({
      serialNumber: `${olt.vendor.slice(0, 3).toUpperCase()}-PENDING-${Math.floor(Math.random() * 90 + 10)}`,
      clientId: null,
      oltId: olt.id,
      ponPort: onus[0]?.ponPort || '0/1/0',
      onuId: 0,
      rxSignal: jitter(-22, 1.5),
      txSignal: jitter(2.2, 0.2),
      distanceMeters: Math.floor(Math.random() * 1800 + 300),
      status: 'unauthorized',
    })
  }

  return {
    olt: { ...olt, status: 'online' },
    onus,
  }
}

module.exports = { pollOlt }
