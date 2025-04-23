<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle($request = Illuminate\Http\Request::capture());

try {
    // Manually configure JWT
    config(['jwt.secret' => 'crydkIvOB4NvSKUSsXXYKoTpnIk0yFw2gxEnljuJBeBhvPulyINFMqY2o9NE5TVI']);
    config(['jwt.algo' => 'HS256']);
    
    $token = \Tymon\JWTAuth\Facades\JWTAuth::attempt(['email' => 'admin@example.com', 'password' => 'password']);
    $user = \Tymon\JWTAuth\Facades\JWTAuth::parseToken()->authenticate();
    
    echo json_encode([
        'success' => true,
        'token' => $token,
        'user' => $user
    ]);
} catch (\Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
