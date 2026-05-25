<?php

final class Audit
{
    public static function log(PDO $db, string $action, ?string $entityType = null, ?int $entityId = null, ?string $message = null, array $metadata = []): void
    {
        $stmt = $db->prepare('INSERT INTO audit_logs (action, entity_type, entity_id, ip_address, message, metadata) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $action,
            $entityType,
            $entityId,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $message,
            $metadata ? json_encode($metadata) : null,
        ]);
    }
}
