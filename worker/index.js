require('dotenv').config()

const { db } = require('./services/db')
const { decrypt } = require('./services/crypto')
const { MikroTikConnector } = require('./drivers/mikrotik/routerosConnector')
const { MockOltDriver } = require('./drivers/olt/mock')

const once = process.argv.includes('--once')

async function setting(key, fallback) {
  const [rows] = await db().execute('SELECT setting_value FROM settings WHERE setting_key=?', [key])
  return rows[0]?.setting_value ?? fallback
}

async function logPoll(deviceType, deviceId, status, message, startedAt) {
  const duration = Date.now() - startedAt
  await db().execute('INSERT INTO device_poll_logs (device_type, device_id, action, status, message, duration_ms) VALUES (?, ?, ?, ?, ?, ?)', [
    deviceType,
    deviceId,
    'poll',
    status,
    String(message || '').slice(0, 255),
    duration,
  ])
}

async function alert(type, sourceType, sourceId, severity, message) {
  await db().execute('INSERT INTO alerts (type, source_type, source_id, severity, message) VALUES (?, ?, ?, ?, ?)', [
    type,
    sourceType,
    sourceId,
    severity,
    message.slice(0, 255),
  ])
}

async function pollMikroTik(router) {
  const startedAt = Date.now()
  try {
    const [creds] = await db().execute('SELECT username, password_encrypted FROM device_credentials WHERE device_type=? AND device_id=?', ['mikrotik', router.id])
    if (!creds[0]) throw new Error('Missing encrypted credentials')

    const connector = new MikroTikConnector({
      host: router.host,
      port: Number(router.api_port || 8728),
      username: creds[0].username,
      password: decrypt(creds[0].password_encrypted),
      secure: router.connection_type === 'api-ssl',
    })
    await connector.connect()
    const identity = await connector.readSystemIdentity()
    const resource = await connector.readRouterOsVersion()
    const interfaces = await connector.readInterfaces()
    const leases = await connector.readDhcpLeases()
    const active = await connector.readPppoeActiveSessions()
    const secrets = await connector.readPppSecrets()
    const queues = await connector.readSimpleQueues()
    await connector.close()

    await db().execute(
      'UPDATE mikrotik_routers SET last_poll_status=?, last_poll_at=NOW(), last_error=NULL, identity=?, routeros_version=?, cpu_load=?, uptime=? WHERE id=?',
      ['success', identity, resource.version, resource.cpuLoad, resource.uptime, router.id],
    )

    await db().execute('DELETE FROM mikrotik_interfaces WHERE mikrotik_router_id=?', [router.id])
    for (const item of interfaces) {
      await db().execute(
        'INSERT INTO mikrotik_interfaces (mikrotik_router_id, name, type, running, disabled, rx_bps, tx_bps) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [router.id, item.name || '', item.type || '', item.running === 'true' ? 1 : 0, item.disabled === 'true' ? 1 : 0, Number(item['rx-byte'] || 0), Number(item['tx-byte'] || 0)],
      )
      await db().execute('INSERT INTO traffic_samples (mikrotik_router_id, interface_name, rx_bps, tx_bps) VALUES (?, ?, ?, ?)', [
        router.id,
        item.name || '',
        Number(item['rx-byte'] || 0),
        Number(item['tx-byte'] || 0),
      ])
    }

    await db().execute('DELETE FROM mikrotik_dhcp_leases WHERE mikrotik_router_id=?', [router.id])
    for (const lease of leases) {
      await db().execute('INSERT INTO mikrotik_dhcp_leases (mikrotik_router_id, address, mac_address, host_name, status) VALUES (?, ?, ?, ?, ?)', [
        router.id,
        lease.address || null,
        lease['mac-address'] || null,
        lease['host-name'] || null,
        lease.status || null,
      ])
    }

    await db().execute('DELETE FROM mikrotik_ppp_active WHERE mikrotik_router_id=?', [router.id])
    for (const row of active) {
      await db().execute('INSERT INTO mikrotik_ppp_active (mikrotik_router_id, name, address, uptime, service, caller_id) VALUES (?, ?, ?, ?, ?, ?)', [
        router.id,
        row.name || '',
        row.address || null,
        row.uptime || null,
        row.service || null,
        row['caller-id'] || null,
      ])
    }

    for (const row of secrets) {
      await db().execute(
        'INSERT INTO mikrotik_ppp_secrets (mikrotik_router_id, remote_id, name, profile, disabled) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE remote_id=VALUES(remote_id), profile=VALUES(profile), disabled=VALUES(disabled), last_seen=NOW()',
        [router.id, row.id || row['.id'] || null, row.name || '', row.profile || null, row.disabled === 'true' ? 1 : 0],
      )
    }

    for (const row of queues) {
      await db().execute(
        'INSERT INTO mikrotik_simple_queues (mikrotik_router_id, remote_id, name, target, max_limit, disabled, bytes) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE target=VALUES(target), max_limit=VALUES(max_limit), disabled=VALUES(disabled), bytes=VALUES(bytes), last_seen=NOW()',
        [router.id, row.id || row['.id'] || null, row.name || '', row.target || null, row['max-limit'] || null, row.disabled === 'true' ? 1 : 0, Number(row.bytes || 0)],
      )
    }

    await logPoll('mikrotik', router.id, 'success', `Polled ${identity}`, startedAt)
  } catch (error) {
    await db().execute('UPDATE mikrotik_routers SET last_poll_status=?, last_poll_at=NOW(), last_error=? WHERE id=?', ['failed', error.message.slice(0, 255), router.id])
    await logPoll('mikrotik', router.id, 'failed', error.message, startedAt)
    await alert('DEVICE_OFFLINE', 'mikrotik', router.id, 'critical', `${router.name} poll failed: ${error.message}`)
  }
}

async function pollMockOlts() {
  const mockMode = await setting('mock_mode', 'false')
  if (mockMode !== 'true') return
  const [olts] = await db().execute("SELECT * FROM olts WHERE enabled=1 AND vendor='mock'")
  const driver = new MockOltDriver()
  for (const olt of olts) {
    const startedAt = Date.now()
    try {
      const unauthorized = await driver.discoverUnauthorizedOnus()
      for (const onu of unauthorized) {
        const [result] = await db().execute(
          'INSERT INTO onus (olt_id, serial_number, pon_port, rx_power, tx_power, distance_meters, status, authorization_status, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE rx_power=VALUES(rx_power), tx_power=VALUES(tx_power), distance_meters=VALUES(distance_meters), status=VALUES(status), authorization_status=VALUES(authorization_status), last_seen=NOW()',
          [olt.id, onu.serialNumber, onu.ponPort, onu.rxPower, onu.txPower, onu.distanceMeters, 'unauthorized', 'unauthorized'],
        )
        const onuId = result.insertId
        if (onuId) {
          await db().execute('INSERT INTO signal_samples (onu_id, rx_power, tx_power) VALUES (?, ?, ?)', [onuId, onu.rxPower, onu.txPower])
        }
      }
      await db().execute('UPDATE olts SET last_poll_status=?, last_poll_at=NOW(), last_error=NULL WHERE id=?', ['success', olt.id])
      await logPoll('olt', olt.id, 'success', 'Mock OLT poll complete', startedAt)
    } catch (error) {
      await db().execute('UPDATE olts SET last_poll_status=?, last_poll_at=NOW(), last_error=? WHERE id=?', ['failed', error.message.slice(0, 255), olt.id])
      await logPoll('olt', olt.id, 'failed', error.message, startedAt)
    }
  }
}

async function pollAll() {
  await db().execute("INSERT INTO settings (setting_key, setting_value) VALUES ('worker_last_seen', NOW()) ON DUPLICATE KEY UPDATE setting_value=NOW()")
  const [routers] = await db().execute('SELECT * FROM mikrotik_routers WHERE enabled=1')
  for (const router of routers) {
    await pollMikroTik(router)
  }
  await pollMockOlts()
}

async function main() {
  await pollAll()
  if (once) process.exit(0)
  const interval = Number(await setting('polling_interval_seconds', process.env.POLL_INTERVAL_SECONDS || 60))
  setInterval(() => pollAll().catch((error) => console.error('[worker]', error)), interval * 1000)
}

main().catch((error) => {
  console.error('[worker] failed', error)
  process.exit(1)
})
