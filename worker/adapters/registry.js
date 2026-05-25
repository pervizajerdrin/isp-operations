const { zteAdapter } = require('./zteAdapter')
const { huaweiAdapter } = require('./huaweiAdapter')
const { genericAdapter } = require('./genericAdapter')

const adapters = new Map([
  ['ZTE', zteAdapter],
  ['Huawei', huaweiAdapter],
  ['VSOL', genericAdapter('VSOL')],
  ['BDCOM', genericAdapter('BDCOM')],
  ['FiberHome', genericAdapter('FiberHome')],
  ['CData', genericAdapter('CData')],
])

function getAdapter(vendor) {
  return adapters.get(vendor) || genericAdapter(vendor || 'Other')
}

module.exports = { getAdapter, adapters }
