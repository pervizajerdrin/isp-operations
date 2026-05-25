const { OltDriver } = require('../driverInterface')

class VsolOltDriver extends OltDriver {
  constructor() {
    super()
    this.todo = 'TODO: implement real VSOL OLT SNMP/CLI commands'
  }
}

module.exports = { VsolOltDriver }
