const { RouterOSClient } = require('routeros-client')

class MikroTikConnector {
  constructor({ host, port, username, password, secure = false, timeout = 10000 }) {
    this.client = new RouterOSClient({
      host,
      port,
      user: username,
      password,
      secure,
      timeout,
    })
  }

  async connect() {
    this.api = await this.client.connect()
    return this.api
  }

  async close() {
    if (this.api) {
      await this.api.close()
    }
  }

  async testConnection() {
    await this.connect()
    const identity = await this.readSystemIdentity()
    await this.close()
    return identity
  }

  async readSystemIdentity() {
    const rows = await this.api.menu('/system/identity').get()
    return rows[0]?.name || ''
  }

  async readRouterOsVersion() {
    const rows = await this.api.menu('/system/resource').get()
    return {
      version: rows[0]?.version || '',
      cpuLoad: Number(rows[0]?.['cpu-load'] || 0),
      uptime: rows[0]?.uptime || '',
    }
  }

  async readInterfaces() {
    return this.api.menu('/interface').get()
  }

  async readDhcpLeases() {
    return this.api.menu('/ip/dhcp-server/lease').get()
  }

  async readPppoeActiveSessions() {
    return this.api.menu('/ppp/active').get()
  }

  async readPppSecrets() {
    return this.api.menu('/ppp/secret').get()
  }

  async readSimpleQueues() {
    return this.api.menu('/queue/simple').get()
  }

  async readInterfaceTraffic(interfaceName) {
    return this.api.write('/interface/monitor-traffic', [`=interface=${interfaceName}`, '=once='])
  }

  async setPppSecretDisabled(name, disabled) {
    const rows = await this.api.menu('/ppp/secret').where('name', name).get()
    if (!rows[0]?.id) return false
    await this.api.menu('/ppp/secret').where('.id', rows[0].id).update({ disabled: disabled ? 'yes' : 'no' })
    return true
  }

  async setSimpleQueueDisabled(name, disabled) {
    const rows = await this.api.menu('/queue/simple').where('name', name).get()
    if (!rows[0]?.id) return false
    await this.api.menu('/queue/simple').where('.id', rows[0].id).update({ disabled: disabled ? 'yes' : 'no' })
    return true
  }

  async upsertSimpleQueue({ name, target, maxLimit }) {
    const rows = await this.api.menu('/queue/simple').where('name', name).get()
    if (rows[0]?.id) {
      await this.api.menu('/queue/simple').where('.id', rows[0].id).update({ target, 'max-limit': maxLimit })
      return rows[0].id
    }
    return this.api.menu('/queue/simple').add({ name, target, 'max-limit': maxLimit })
  }

  async deleteSimpleQueue(name) {
    const rows = await this.api.menu('/queue/simple').where('name', name).get()
    if (!rows[0]?.id) return false
    await this.api.menu('/queue/simple').where('.id', rows[0].id).remove()
    return true
  }

  async pingClient(address) {
    return this.api.write('/ping', [`=address=${address}`, '=count=3'])
  }
}

module.exports = { MikroTikConnector }
