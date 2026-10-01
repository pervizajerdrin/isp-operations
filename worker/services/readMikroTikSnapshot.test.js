const test = require('node:test')
const assert = require('node:assert/strict')
const { readMikroTikSnapshot } = require('./readMikroTikSnapshot')

function connector(failAt, closeFails = false) {
  const failure = new Error('router read failed')
  const device = { closes: 0, failure }
  for (const method of ['connect', 'readSystemIdentity', 'readRouterOsVersion', 'readInterfaces',
    'readDhcpLeases', 'readPppoeActiveSessions', 'readPppSecrets', 'readSimpleQueues']) {
    device[method] = async () => {
      if (method === failAt) throw failure
      return method === 'readSystemIdentity' ? 'test-router' : []
    }
  }
  device.close = async () => {
    await new Promise(resolve => setImmediate(resolve))
    device.closes++
    if (closeFails) throw new Error('close failed')
  }
  return device
}

test('successful snapshots wait for the connection to close', async () => {
  const device = connector()
  const result = await readMikroTikSnapshot(device)
  assert.equal(result.identity, 'test-router')
  assert.equal(device.closes, 1)
})

test('failed reads close the connection and preserve the original error', async () => {
  for (const method of ['connect', 'readSystemIdentity', 'readInterfaces', 'readSimpleQueues']) {
    const device = connector(method)
    await assert.rejects(readMikroTikSnapshot(device), error => error === device.failure)
    assert.equal(device.closes, 1, method)
  }
})

test('cleanup errors do not replace the original read failure', async () => {
  const device = connector('readInterfaces', true)
  await assert.rejects(readMikroTikSnapshot(device), error => error === device.failure)
  assert.equal(device.closes, 1)
})

test('cleanup failure after a successful read is reported', async () => {
  await assert.rejects(readMikroTikSnapshot(connector(undefined, true)), /close failed/)
})
