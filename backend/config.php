<?php

$env = parse_ini_file(__DIR__ . '/../.env', false, INI_SCANNER_RAW) ?: [];

define('API_BASE_URL', rtrim($env['API_BASE_URL'] ?? 'http://127.0.0.1:8000/api/v1', '/'));