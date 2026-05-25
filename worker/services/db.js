const mysql = require('mysql2/promise')

let pool

function db() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'db',
      port: Number(process.env.DB_PORT || 3306),
      database: process.env.DB_DATABASE || 'app_db',
      user: process.env.DB_USERNAME || 'app_user',
      password: process.env.DB_PASSWORD || '',
      waitForConnections: true,
      connectionLimit: 5,
      namedPlaceholders: true,
    })
  }

  return pool
}

module.exports = { db }
