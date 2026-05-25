<?php

function json_response(mixed $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data, JSON_UNESCAPED_SLASHES);
}

function error_response(string $message, int $status = 400, array $details = []): void
{
    json_response(['error' => $message, 'details' => $details], $status);
}
