const crypto = require('crypto')

function key() {
  if (!process.env.APP_KEY) {
    throw new Error('APP_KEY is required to decrypt device credentials')
  }
  return crypto.createHash('sha256').update(process.env.APP_KEY).digest()
}

function decrypt(value) {
  const raw = Buffer.from(value, 'base64')
  const iv = raw.subarray(0, 12)
  const tag = raw.subarray(12, 28)
  const cipher = raw.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(cipher), decipher.final()]).toString('utf8')
}

module.exports = { decrypt }
