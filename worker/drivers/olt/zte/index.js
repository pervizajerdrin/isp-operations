const { OltDriver } = require('../driverInterface')

class ZteOltDriver extends OltDriver {
  constructor() {
    super()
    this.todo = 'TODO: implement real ZTE OLT SNMP/CLI commands'
  }
}

module.exports = { ZteOltDriver }
