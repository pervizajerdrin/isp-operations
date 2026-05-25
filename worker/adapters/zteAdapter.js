const { VendorAdapter } = require('./baseAdapter')

const zteAdapter = new VendorAdapter(
  'ZTE',
  {
    onuSerial: '1.3.6.1.4.1.3902.1082.mock.serial',
    onuRxPower: '1.3.6.1.4.1.3902.1082.mock.rx',
    onuTxPower: '1.3.6.1.4.1.3902.1082.mock.tx',
    onuDistance: '1.3.6.1.4.1.3902.1082.mock.distance',
    temperature: '1.3.6.1.4.1.3902.1082.mock.temperature',
  },
  ['snmp-discovery', 'authorize', 'profiles', 'reboot', 'firmware'],
)

zteAdapter.authorizeOnu = ({ serial, ponPort, onuId, vlan, profile }) => [
  `interface ${ponPort}`,
  `onu ${onuId} type bridge sn ${serial}`,
  `onu ${onuId} service internet gemport 1 vlan ${vlan}`,
  `onu ${onuId} profile ${profile}`,
]

module.exports = { zteAdapter }
