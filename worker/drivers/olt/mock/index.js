const { OltDriver } = require('../driverInterface')

class MockOltDriver extends OltDriver {
  async discoverUnauthorizedOnus() {
    return [{ serialNumber: 'MOCK-ONU-001', ponPort: 'PON1', rxPower: -22.4, txPower: 2.1, distanceMeters: 900 }]
  }
  async authorizeOnu({ serialNumber, ponPort, onuId }) {
    return { ok: true, serialNumber, ponPort, onuId }
  }
  async rebootOnu({ serialNumber }) {
    return { ok: true, serialNumber, action: 'reboot' }
  }
  async disableOnu({ serialNumber }) {
    return { ok: true, serialNumber, action: 'disable' }
  }
  async getOnuSignal() {
    return { rxPower: -22.4, txPower: 2.1 }
  }
  async getPonPorts() {
    return [{ name: 'PON1', status: 'online' }, { name: 'PON2', status: 'online' }]
  }
  async getOnuStatus() {
    return { status: 'online', lastSeen: new Date() }
  }
}

module.exports = { MockOltDriver }
