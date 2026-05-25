# TitanDesk Community

TitanDesk Community is an open-source ISP operations starter for managing clients, packages, MikroTik routers, OLT inventory, ONU records, alerts, and monitoring data.

The project is designed around a simple production path: the frontend talks to the PHP API, the PHP API reads and writes MySQL, and a separate Node.js worker polls network devices and stores results in MySQL.

## Features

- Client and package management
- MikroTik router inventory
- Encrypted device credential storage
- RouterOS API worker for polling MikroTik devices
- Interfaces, DHCP leases, PPPoE sessions, PPP secrets, and simple queue snapshots
- OLT and ONU inventory
- Mock OLT driver for development
- Driver interfaces for future ZTE, Huawei, BDCOM, and VSOL support
- Alerts, audit logs, traffic samples, and signal samples
- Flat, table-first React interface

## Screenshots

Screenshots will be added after the first public UI pass.

## Tech Stack

- React, TypeScript, TailwindCSS
- PHP 8 with PDO MySQL
- MySQL
- Node.js worker
- RouterOS API connector

## Installation

Install frontend dependencies:

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Install worker dependencies:

```bash
cd worker
npm install
copy .env.example .env
```

Run the PHP API in development:

```bash
cd backend
copy .env.example .env
php -S localhost:8080 -t . api/index.php
```

## Environment Setup

Use the `.env.example` files as templates. Do not commit real `.env` files.

Important settings:

```text
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=app_db
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password
CORS_ORIGIN=http://localhost:5173
APP_KEY=replace-with-a-long-random-string
```

The API and worker must use the same `APP_KEY` so the worker can decrypt device credentials.

## Database Setup

Create a local database:

```sql
CREATE DATABASE app_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Run migrations:

```bash
mysql -u your_database_user -p app_db < database/001_schema.sql
mysql -u your_database_user -p app_db < database/002_seed.sql
```

The seed file contains neutral demo records only.

## Development

Start the frontend:

```bash
cd frontend
npm run dev
```

Start the API:

```bash
cd backend
php -S localhost:8080 -t . api/index.php
```

Run one worker poll:

```bash
cd worker
npm run poll:once
```

Run the worker continuously:

```bash
npm start
```

## What Works

- Frontend screens load from the PHP API
- MySQL schema and neutral seed data
- Client creation and listing
- Package creation and listing
- MikroTik router creation with encrypted credentials
- Worker polling for real MikroTik RouterOS API devices
- Poll logs, alerts, and monitoring records written to MySQL
- Mock OLT development driver

## What Does Not Work Yet

- Real OLT vendor integrations are not implemented
- Full authentication/session middleware is minimal
- Manual poll currently records a request; a durable queue should be added
- Billing and ticketing are not included
- Production deployment hardening is still required

## Security Notes

- Never commit real `.env` files.
- Rotate `APP_KEY` and device passwords before using a public fork in production.
- Device passwords are encrypted before being stored.
- Device passwords are never returned by the API.
- Review git history before publishing if this code ever lived in a private repo.

## Contributing

Issues and pull requests are welcome. Please keep changes focused, include migration notes for schema changes, and avoid committing generated build output.

## License

MIT
