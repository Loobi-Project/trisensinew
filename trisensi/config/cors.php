<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'staffadmin/*', 'confirm/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'https://goloobi.com',
        'https://www.goloobi.com', // Tambahan untuk www subdomain
        env('APP_URL', 'https://goloobi.com'),
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        'Accept',
        'Authorization',
        'Content-Type',
        'X-Requested-With',
        'X-CSRF-TOKEN',
        'X-XSRF-TOKEN',
        'Origin',
        'Cache-Control',
    ],

    'exposed_headers' => [
        'X-CSRF-TOKEN',
    ],

    'max_age' => 86400, // 24 hours

    'supports_credentials' => true,
];