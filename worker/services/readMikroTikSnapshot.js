async function readMikroTikSnapshot(connector) {
  let readFailed = false
  try {
    await connector.connect()
    return {
      identity: await connector.readSystemIdentity(),
      resource: await connector.readRouterOsVersion(),
      interfaces: await connector.readInterfaces(),
      leases: await connector.readDhcpLeases(),
      active: await connector.readPppoeActiveSessions(),
      secrets: await connector.readPppSecrets(),
      queues: await connector.readSimpleQueues(),
    }
  } catch (error) {
    readFailed = true
    throw error
  } finally {
    try {
      await connector.close()
    } catch (error) {
      if (!readFailed) throw error
    }
  }
}

module.exports = { readMikroTikSnapshot }
