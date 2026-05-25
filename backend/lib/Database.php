<?php

final class Database
{
    private static ?PDO $pdo = null;

    public static function pdo(): PDO
    {
        if (self::$pdo) {
            return self::$pdo;
        }

        $host = getenv('DB_HOST') ?: 'db';
        $port = getenv('DB_PORT') ?: '3306';
        $name = getenv('DB_DATABASE') ?: 'app_db';
        $user = getenv('DB_USERNAME') ?: 'app_user';
        $pass = getenv('DB_PASSWORD') ?: '';
        $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";

        self::$pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        return self::$pdo;
    }
}
