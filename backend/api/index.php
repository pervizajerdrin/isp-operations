<?php

require_once __DIR__ . '/../lib/Env.php';
load_env_file(__DIR__ . '/../.env');
require_once __DIR__ . '/../lib/Database.php';
require_once __DIR__ . '/../lib/Response.php';
require_once __DIR__ . '/../lib/Validator.php';
require_once __DIR__ . '/../lib/Crypto.php';
require_once __DIR__ . '/../services/Audit.php';
require_once __DIR__ . '/../middleware/RateLimiter.php';

$origin = getenv('CORS_ORIGIN') ?: '*';
header("Access-Control-Allow-Origin: {$origin}");
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function route_segments(): array
{
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
    $path = preg_replace('#^/api#', '', $path);
    return array_values(array_filter(explode('/', trim($path, '/'))));
}

function setting(PDO $db, string $key, string $default = ''): string
{
    $stmt = $db->prepare('SELECT setting_value FROM settings WHERE setting_key = ?');
    $stmt->execute([$key]);
    $value = $stmt->fetchColumn();
    return $value === false ? $default : (string) $value;
}

function list_rows(PDO $db, string $sql, array $params = []): array
{
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

try {
    $db = Database::pdo();
    $method = $_SERVER['REQUEST_METHOD'];
    $parts = route_segments();
    $module = $parts[0] ?? 'health';
    $id = isset($parts[1]) && ctype_digit($parts[1]) ? (int) $parts[1] : null;

    if ($module === 'health') {
        json_response(['ok' => true, 'service' => 'TitanDesk Community API']);
        exit;
    }

    if ($module === 'auth' && ($parts[1] ?? '') === 'login' && $method === 'POST') {
        if (!RateLimiter::check('login', 10, 60)) {
            error_response('Too many login attempts', 429);
            exit;
        }
        $data = body_json();
        $stmt = $db->prepare('SELECT id, name, email, password_hash, role FROM users WHERE email = ? AND active = 1');
        $stmt->execute([$data['email'] ?? '']);
        $user = $stmt->fetch();
        if (!$user || !password_verify((string) ($data['password'] ?? ''), $user['password_hash'])) {
            error_response('Invalid credentials', 401);
            exit;
        }
        Audit::log($db, 'login', 'user', (int) $user['id'], 'User logged in');
        json_response(['user' => ['id' => (int) $user['id'], 'name' => $user['name'], 'email' => $user['email'], 'role' => $user['role']]]);
        exit;
    }

    if ($module === 'dashboard') {
        $warning = (float) setting($db, 'signal_warning_threshold', '-25');
        json_response([
            'totalClients' => (int) $db->query('SELECT COUNT(*) FROM clients')->fetchColumn(),
            'activeClients' => (int) $db->query("SELECT COUNT(*) FROM clients WHERE status = 'active'")->fetchColumn(),
            'offlineDevices' => (int) $db->query("SELECT COUNT(*) FROM mikrotik_routers WHERE last_poll_status = 'failed'")->fetchColumn() + (int) $db->query("SELECT COUNT(*) FROM olts WHERE last_poll_status = 'failed'")->fetchColumn(),
            'activeMikrotikRouters' => (int) $db->query("SELECT COUNT(*) FROM mikrotik_routers WHERE enabled = 1 AND last_poll_status = 'success'")->fetchColumn(),
            'onlinePppoeSessions' => (int) $db->query('SELECT COUNT(*) FROM mikrotik_ppp_active WHERE last_seen >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)')->fetchColumn(),
            'unauthorizedOnus' => (int) $db->query("SELECT COUNT(*) FROM onus WHERE authorization_status = 'unauthorized' OR status = 'unauthorized'")->fetchColumn(),
            'weakSignalOnus' => (int) list_rows($db, 'SELECT COUNT(*) AS c FROM onus WHERE rx_power IS NOT NULL AND rx_power <= ?', [$warning])[0]['c'],
            'recentAlerts' => list_rows($db, 'SELECT * FROM alerts ORDER BY created_at DESC LIMIT 8'),
            'recentDeviceEvents' => list_rows($db, 'SELECT * FROM device_poll_logs ORDER BY created_at DESC LIMIT 8'),
        ]);
        exit;
    }

    if ($module === 'clients') {
        if ($method === 'GET') {
            json_response(list_rows($db, 'SELECT clients.*, packages.name AS package_name FROM clients LEFT JOIN packages ON packages.id = clients.package_id ORDER BY clients.id DESC'));
            exit;
        }
        $data = body_json();
        $errors = require_fields($data, ['name']);
        if ($errors) {
            error_response('Validation failed', 422, $errors);
            exit;
        }
        if ($method === 'POST') {
            $stmt = $db->prepare('INSERT INTO clients (name, phone, email, address, package_id, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([$data['name'], $data['phone'] ?? null, $data['email'] ?? null, $data['address'] ?? null, $data['package_id'] ?? null, $data['status'] ?? 'active', $data['notes'] ?? null]);
            Audit::log($db, 'create', 'client', (int) $db->lastInsertId(), 'Client created');
            json_response(['id' => (int) $db->lastInsertId()], 201);
            exit;
        }
        if (($method === 'PUT' || $method === 'PATCH') && $id) {
            $stmt = $db->prepare('UPDATE clients SET name=?, phone=?, email=?, address=?, package_id=?, status=?, notes=? WHERE id=?');
            $stmt->execute([$data['name'], $data['phone'] ?? null, $data['email'] ?? null, $data['address'] ?? null, $data['package_id'] ?? null, $data['status'] ?? 'active', $data['notes'] ?? null, $id]);
            Audit::log($db, 'update', 'client', $id, 'Client updated');
            json_response(['updated' => true]);
            exit;
        }
        if ($method === 'DELETE' && $id) {
            $stmt = $db->prepare('DELETE FROM clients WHERE id=?');
            $stmt->execute([$id]);
            Audit::log($db, 'delete', 'client', $id, 'Client deleted');
            json_response(['deleted' => true]);
            exit;
        }
    }

    if ($module === 'packages') {
        if ($method === 'GET') {
            json_response(list_rows($db, 'SELECT * FROM packages ORDER BY name'));
            exit;
        }
        $data = body_json();
        $errors = require_fields($data, ['name', 'download_mbps', 'upload_mbps']);
        if ($errors) {
            error_response('Validation failed', 422, $errors);
            exit;
        }
        if ($method === 'POST') {
            $stmt = $db->prepare('INSERT INTO packages (name, download_mbps, upload_mbps, price, mikrotik_queue_limit, active) VALUES (?, ?, ?, ?, ?, ?)');
            $stmt->execute([$data['name'], (int) $data['download_mbps'], (int) $data['upload_mbps'], (float) ($data['price'] ?? 0), $data['mikrotik_queue_limit'] ?? null, (int) ($data['active'] ?? 1)]);
            Audit::log($db, 'create', 'package', (int) $db->lastInsertId(), 'Package created');
            json_response(['id' => (int) $db->lastInsertId()], 201);
            exit;
        }
    }

    if ($module === 'mikrotik-routers') {
        if ($method === 'GET') {
            json_response(list_rows($db, 'SELECT id, name, host, api_port, connection_type, location, enabled, last_poll_status, last_poll_at, last_error, identity, routeros_version, cpu_load, uptime, created_at, updated_at FROM mikrotik_routers ORDER BY id DESC'));
            exit;
        }
        $data = body_json();
        $errors = require_fields($data, ['name', 'host', 'username']);
        if (!$id && empty($data['password'])) {
            $errors['password'] = 'Required';
        }
        if ($errors) {
            error_response('Validation failed', 422, $errors);
            exit;
        }
        if ($method === 'POST') {
            $stmt = $db->prepare('INSERT INTO mikrotik_routers (name, host, api_port, connection_type, location, enabled) VALUES (?, ?, ?, ?, ?, ?)');
            $stmt->execute([$data['name'], $data['host'], (int) ($data['api_port'] ?? 8728), $data['connection_type'] ?? 'api', $data['location'] ?? null, (int) ($data['enabled'] ?? 1)]);
            $newId = (int) $db->lastInsertId();
            $cred = $db->prepare('INSERT INTO device_credentials (device_type, device_id, username, password_encrypted) VALUES (?, ?, ?, ?)');
            $cred->execute(['mikrotik', $newId, $data['username'], Crypto::encrypt($data['password'])]);
            Audit::log($db, 'create', 'mikrotik', $newId, 'MikroTik router created');
            json_response(['id' => $newId], 201);
            exit;
        }
        if (($method === 'PUT' || $method === 'PATCH') && $id) {
            $stmt = $db->prepare('UPDATE mikrotik_routers SET name=?, host=?, api_port=?, connection_type=?, location=?, enabled=? WHERE id=?');
            $stmt->execute([$data['name'], $data['host'], (int) ($data['api_port'] ?? 8728), $data['connection_type'] ?? 'api', $data['location'] ?? null, (int) ($data['enabled'] ?? 1), $id]);
            if (!empty($data['password'])) {
                $cred = $db->prepare('INSERT INTO device_credentials (device_type, device_id, username, password_encrypted) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE username=VALUES(username), password_encrypted=VALUES(password_encrypted)');
                $cred->execute(['mikrotik', $id, $data['username'], Crypto::encrypt($data['password'])]);
            }
            Audit::log($db, 'update', 'mikrotik', $id, 'MikroTik router updated');
            json_response(['updated' => true]);
            exit;
        }
    }

    if ($module === 'mikrotik-data' && $id) {
        json_response([
            'interfaces' => list_rows($db, 'SELECT * FROM mikrotik_interfaces WHERE mikrotik_router_id=? ORDER BY name', [$id]),
            'dhcpLeases' => list_rows($db, 'SELECT * FROM mikrotik_dhcp_leases WHERE mikrotik_router_id=? ORDER BY last_seen DESC LIMIT 200', [$id]),
            'pppActive' => list_rows($db, 'SELECT * FROM mikrotik_ppp_active WHERE mikrotik_router_id=? ORDER BY name', [$id]),
            'pppSecrets' => list_rows($db, 'SELECT id, name, profile, disabled, last_seen FROM mikrotik_ppp_secrets WHERE mikrotik_router_id=? ORDER BY name', [$id]),
            'simpleQueues' => list_rows($db, 'SELECT * FROM mikrotik_simple_queues WHERE mikrotik_router_id=? ORDER BY name', [$id]),
        ]);
        exit;
    }

    if ($module === 'manual-poll' && $method === 'POST') {
        if (!RateLimiter::check('device-action', 30, 60)) {
            error_response('Too many device actions', 429);
            exit;
        }
        $data = body_json();
        $stmt = $db->prepare('INSERT INTO device_poll_logs (device_type, device_id, action, status, message) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$data['device_type'] ?? 'mikrotik', (int) ($data['device_id'] ?? 0), 'manual_poll', 'success', 'Manual poll requested']);
        Audit::log($db, 'manual_poll', $data['device_type'] ?? 'device', (int) ($data['device_id'] ?? 0), 'Manual poll requested');
        json_response(['queued' => true]);
        exit;
    }

    if ($module === 'test-connection' && $method === 'POST') {
        if (!RateLimiter::check('device-action', 30, 60)) {
            error_response('Too many device actions', 429);
            exit;
        }
        $data = body_json();
        Audit::log($db, 'test_connection', $data['device_type'] ?? 'device', (int) ($data['device_id'] ?? 0), 'Connection test requested');
        json_response(['queued' => true, 'message' => 'Worker will perform the real device test and write poll logs']);
        exit;
    }

    $simpleModules = [
        'olts' => 'SELECT * FROM olts ORDER BY id DESC',
        'onus' => 'SELECT onus.*, clients.name AS client_name, olts.name AS olt_name FROM onus LEFT JOIN clients ON clients.id=onus.client_id LEFT JOIN olts ON olts.id=onus.olt_id ORDER BY onus.id DESC',
        'monitoring' => 'SELECT * FROM traffic_samples ORDER BY sampled_at DESC LIMIT 200',
        'alerts' => 'SELECT * FROM alerts ORDER BY created_at DESC LIMIT 100',
        'settings' => 'SELECT setting_key, setting_value, updated_at FROM settings ORDER BY setting_key',
        'audit-logs' => 'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200',
    ];
    if (isset($simpleModules[$module]) && $method === 'GET') {
        json_response(list_rows($db, $simpleModules[$module]));
        exit;
    }

    error_response('Not found', 404);
} catch (Throwable $error) {
    error_response('Server error', 500, ['message' => $error->getMessage()]);
}
