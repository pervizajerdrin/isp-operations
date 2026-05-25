const { db } = require('../services/db')
const { getSettings } = require('../services/settings')
const { pollOlt } = require('../drivers/mock/mockDriver')

async function pollMockOlts() {
  const settings = await getSettings()
  if (!settings.mockMode) {
    return { olts: 0, onus: 0, events: 0 }
  }

  const [olts] = await db().query('SELECT * FROM olts ORDER BY id')
  let onuCount = 0
  let eventCount = 0

  for (const olt of olts) {
    const [existing] = await db().execute('SELECT * FROM onus WHERE olt_id = ?', [olt.id])
    const previousBySerial = new Map(existing.map((onu) => [onu.serial_number, onu]))
    const poll = pollOlt(olt, existing)

    await db().execute('UPDATE olts SET status = ?, last_poll = NOW() WHERE id = ?', [poll.olt.status, olt.id])

    for (const onu of poll.onus) {
      const previous = previousBySerial.get(onu.serialNumber)
      const [result] = await db().execute(
        `INSERT INTO onus
          (serial_number, client_id, olt_id, pon_port, onu_id, rx_signal, tx_signal, distance_meters, status, last_seen)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
          id = LAST_INSERT_ID(id),
          client_id = VALUES(client_id),
          olt_id = VALUES(olt_id),
          pon_port = VALUES(pon_port),
          onu_id = VALUES(onu_id),
          rx_signal = VALUES(rx_signal),
          tx_signal = VALUES(tx_signal),
          distance_meters = VALUES(distance_meters),
          status = VALUES(status),
          last_seen = NOW()`,
        [
          onu.serialNumber,
          onu.clientId,
          onu.oltId,
          onu.ponPort,
          onu.onuId,
          onu.rxSignal,
          onu.txSignal,
          onu.distanceMeters,
          onu.status,
        ],
      )

      const onuId = result.insertId
      onuCount += 1

      await db().execute('INSERT INTO signal_history (onu_id, rx_signal, tx_signal) VALUES (?, ?, ?)', [
        onuId,
        onu.rxSignal,
        onu.txSignal,
      ])

      const events = buildEvents(previous, onu, settings)
      for (const event of events) {
        await db().execute('INSERT INTO onu_events (onu_id, event_type, message, severity) VALUES (?, ?, ?, ?)', [
          onuId,
          event.type,
          event.message,
          event.severity,
        ])
        eventCount += 1
      }
    }

    await refreshPonCounts(olt.id)
  }

  return { olts: olts.length, onus: onuCount, events: eventCount }
}

function buildEvents(previous, onu, settings) {
  const events = []
  if (!previous) {
    events.push({
      type: onu.status === 'unauthorized' ? 'UNAUTHORIZED' : 'DISCOVERED',
      message: onu.status === 'unauthorized' ? 'Unregistered ONU detected' : 'ONU discovered by mock poller',
      severity: onu.status === 'unauthorized' ? 'warning' : 'info',
    })
    return events
  }

  if (previous.status !== onu.status) {
    events.push({
      type: onu.status === 'offline' ? 'LOS' : 'RESTORE',
      message: `ONU status changed from ${previous.status} to ${onu.status}`,
      severity: onu.status === 'offline' ? 'critical' : 'info',
    })
  }

  if (onu.rxSignal <= settings.signalCriticalThreshold && previous.rx_signal > settings.signalCriticalThreshold) {
    events.push({ type: 'SIGNAL_CRITICAL', message: 'RX signal crossed critical threshold', severity: 'critical' })
  } else if (onu.rxSignal <= settings.signalWarningThreshold && previous.rx_signal > settings.signalWarningThreshold) {
    events.push({ type: 'SIGNAL_WARN', message: 'RX signal crossed warning threshold', severity: 'warning' })
  }

  return events
}

async function refreshPonCounts(oltId) {
  const [ports] = await db().execute(
    `SELECT pon_port, COUNT(*) AS onu_count, SUM(status = 'online') AS online_count
     FROM onus
     WHERE olt_id = ?
     GROUP BY pon_port`,
    [oltId],
  )

  for (const port of ports) {
    await db().execute(
      `INSERT INTO pon_ports (olt_id, label, description, onu_count, online_count)
       VALUES (?, ?, 'Auto discovered by worker', ?, ?)
       ON DUPLICATE KEY UPDATE onu_count = VALUES(onu_count), online_count = VALUES(online_count)`,
      [oltId, port.pon_port, port.onu_count, port.online_count || 0],
    )
  }
}

module.exports = { pollMockOlts }
