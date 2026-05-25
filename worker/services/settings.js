const { db } = require('./db')

async function getSettings() {
  const [rows] = await db().query('SELECT setting_key, setting_value FROM settings')
  const settings = Object.fromEntries(rows.map((row) => [row.setting_key, row.setting_value]))

  return {
    signalWarningThreshold: Number(settings.signal_warning_threshold || -25),
    signalCriticalThreshold: Number(settings.signal_critical_threshold || -30),
    mockMode: (settings.mock_mode || process.env.MOCK_MODE || 'true') === 'true',
  }
}

module.exports = { getSettings }
