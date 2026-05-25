class VendorAdapter {
  constructor(vendor, oids, capabilities) {
    this.vendor = vendor
    this.oids = oids
    this.capabilities = capabilities
  }

  discoverOnus() {
    throw new Error(`${this.vendor} discoverOnus is not implemented`)
  }

  authorizeOnu() {
    throw new Error(`${this.vendor} authorizeOnu is not implemented`)
  }

  buildProvisioningCommands(template, variables) {
    return Object.entries(variables).reduce(
      (body, [key, value]) => body.replaceAll(`\${${key}}`, String(value)),
      template,
    )
  }
}

module.exports = { VendorAdapter }
