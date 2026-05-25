INSERT INTO users (name, email, password_hash, role) VALUES
('Demo Administrator', 'admin@example.test', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON DUPLICATE KEY UPDATE role = VALUES(role);

INSERT INTO packages (name, download_mbps, upload_mbps, price, mikrotik_queue_limit) VALUES
('Home Fiber 300/100', 300, 100, 4990, '300M/100M'),
('Home Fiber 1000/300', 1000, 300, 8990, '1000M/300M'),
('Business Fiber 600/200', 600, 200, 24900, '600M/200M')
ON DUPLICATE KEY UPDATE download_mbps = VALUES(download_mbps), upload_mbps = VALUES(upload_mbps), price = VALUES(price);

INSERT INTO settings (setting_key, setting_value) VALUES
('polling_interval_seconds', '60'),
('signal_warning_threshold', '-25'),
('signal_critical_threshold', '-30'),
('mock_mode', 'true'),
('worker_last_seen', ''),
('api_name', 'TitanDesk Community API')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

INSERT INTO clients (name, phone, email, address, package_id, status) VALUES
('Demo Residential Client', '+1 555 0100', 'customer@example.test', '100 Example Street', 2, 'active'),
('Demo Business Client', '+1 555 0101', 'business@example.test', '200 Sample Avenue', 3, 'active')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO olts (name, vendor, host, location, enabled) VALUES
('Demo Mock OLT', 'mock', 'mock://local', 'Lab', 1);
