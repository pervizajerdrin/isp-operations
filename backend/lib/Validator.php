<?php

function require_fields(array $data, array $fields): array
{
    $errors = [];
    foreach ($fields as $field) {
        if (!isset($data[$field]) || trim((string) $data[$field]) === '') {
            $errors[$field] = 'Required';
        }
    }
    return $errors;
}

function body_json(): array
{
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}
