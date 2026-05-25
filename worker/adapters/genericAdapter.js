const { VendorAdapter } = require('./baseAdapter')

function genericAdapter(vendor) {
  const adapter = new VendorAdapter(
    vendor,
    {
      onuSerial: 'vendor.generic.onu.serial',
      onuRxPower: 'vendor.generic.onu.rx',
      onuTxPower: 'vendor.generic.onu.tx',
      temperature: 'vendor.generic.temperature',
    },
    ['snmp-discovery', 'authorize', 'reboot'],
  )

  adapter.authorizeOnu = ({ serial, ponPort, onuId, vlan, profile }) => [
    `authorize onu serial=${serial} pon=${ponPort} id=${onuId}`,
    `set vlan ${vlan}`,
    `apply profile ${profile}`,
  ]

  return adapter
}

module.exports = { genericAdapter }
