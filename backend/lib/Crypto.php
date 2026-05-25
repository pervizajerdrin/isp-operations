<?php

final class Crypto
{
    public static function encrypt(string $plain): string
    {
        $key = self::key();
        $iv = random_bytes(12);
        $tag = '';
        $cipher = openssl_encrypt($plain, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
        if ($cipher === false) {
            throw new RuntimeException('Encryption failed');
        }
        return base64_encode($iv . $tag . $cipher);
    }

    public static function decrypt(string $encrypted): string
    {
        $raw = base64_decode($encrypted, true);
        if ($raw === false || strlen($raw) < 29) {
            throw new RuntimeException('Invalid encrypted value');
        }
        $iv = substr($raw, 0, 12);
        $tag = substr($raw, 12, 16);
        $cipher = substr($raw, 28);
        $plain = openssl_decrypt($cipher, 'aes-256-gcm', self::key(), OPENSSL_RAW_DATA, $iv, $tag);
        if ($plain === false) {
            throw new RuntimeException('Decryption failed');
        }
        return $plain;
    }

    public static function keyStatus(): string
    {
        return getenv('APP_KEY') ? 'configured' : 'missing';
    }

    private static function key(): string
    {
        $key = getenv('APP_KEY');
        if (!$key) {
            throw new RuntimeException('APP_KEY is required for device credential encryption');
        }
        return hash('sha256', $key, true);
    }
}
