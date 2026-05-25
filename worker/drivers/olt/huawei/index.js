const { OltDriver } = require('../driverInterface')

class HuaweiOltDriver extends OltDriver {
  constructor() {
    super()
    this.todo = 'TODO: implement real Huawei OLT SNMP/CLI commands'
  }
}

module.exports = { HuaweiOltDriver }
