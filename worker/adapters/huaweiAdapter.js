const { VendorAdapter } = require('./baseAdapter')

const huaweiAdapter = new VendorAdapter(
  'Huawei',
  {
    onuSerial: '1.3.6.1.4.1.2011.mock.serial',
    onuRxPower: '1.3.6.1.4.1.2011.mock.rx',
    onuTxPower: '1.3.6.1.4.1.2011.mock.tx',
    onuDistance: '1.3.6.1.4.1.2011.mock.distance',
    temperature: '1.3.6.1.4.1.2011.mock.temperature',
  },
  ['snmp-discovery', 'authorize', 'line-profile', 'service-profile', 'reboot'],
)

huaweiAdapter.authorizeOnu = ({ serial, frame = 0, slot = 1, pon = 0, onuId, vlan, profile }) => [
  `interface gpon ${frame}/${slot}`,
  `ont add ${pon} ${onuId} sn-auth ${serial} omci ont-lineprofile-name ${profile} ont-srvprofile-name ${profile}`,
  `service-port vlan ${vlan} gpon ${frame}/${slot}/${pon} ont ${onuId} gemport 1 multi-service user-vlan ${vlan}`,
]

module.exports = { huaweiAdapter }
