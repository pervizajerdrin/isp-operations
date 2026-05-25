class OltDriver {
  async discoverUnauthorizedOnus() {
    throw new Error('discoverUnauthorizedOnus not implemented')
  }
  async authorizeOnu() {
    throw new Error('authorizeOnu not implemented')
  }
  async rebootOnu() {
    throw new Error('rebootOnu not implemented')
  }
  async disableOnu() {
    throw new Error('disableOnu not implemented')
  }
  async getOnuSignal() {
    throw new Error('getOnuSignal not implemented')
  }
  async getPonPorts() {
    throw new Error('getPonPorts not implemented')
  }
  async getOnuStatus() {
    throw new Error('getOnuStatus not implemented')
  }
}

module.exports = { OltDriver }
