const { OltDriver } = require('../driverInterface')

class BdcomOltDriver extends OltDriver {
  constructor() {
    super()
    this.todo = 'TODO: implement real BDCOM OLT SNMP/CLI commands'
  }
}

module.exports = { BdcomOltDriver }
