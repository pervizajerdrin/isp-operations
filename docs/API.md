# TitanDesk Community REST API

Base URL:

```text
http://localhost:8080/api
```

Endpoints implemented in PHP:

```text
GET  /health
POST /api/auth/login
GET  /api/dashboard
GET  /api/clients
POST /api/clients
PUT  /api/clients/{id}
DELETE /api/clients/{id}
GET  /api/packages
POST /api/packages
GET  /api/mikrotik-routers
POST /api/mikrotik-routers
PUT  /api/mikrotik-routers/{id}
GET  /api/mikrotik-data/{routerId}
GET  /api/olts
GET  /api/onus
GET  /api/monitoring
GET  /api/alerts
GET  /api/settings
GET  /api/audit-logs
POST /api/manual-poll
POST /api/test-connection
```

Credentials are encrypted with `APP_KEY`, never returned to the frontend, and device actions are rate limited.
