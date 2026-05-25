<?php

final class RateLimiter
{
    public static function check(string $bucket, int $limit, int $windowSeconds): bool
    {
        $dir = sys_get_temp_dir() . '/titandesk-community-rate';
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'local';
        $file = $dir . '/' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $bucket . '_' . $ip) . '.json';
        $now = time();
        $state = is_file($file) ? json_decode((string) file_get_contents($file), true) : ['reset' => $now + $windowSeconds, 'count' => 0];
        if (($state['reset'] ?? 0) < $now) {
            $state = ['reset' => $now + $windowSeconds, 'count' => 0];
        }
        $state['count']++;
        file_put_contents($file, json_encode($state));
        return $state['count'] <= $limit;
    }
}
