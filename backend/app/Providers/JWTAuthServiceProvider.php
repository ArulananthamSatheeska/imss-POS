<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Tymon\JWTAuth\Providers\LaravelServiceProvider;
use Tymon\JWTAuth\JWTGuard;
use Illuminate\Support\Facades\Auth;

class JWTAuthServiceProvider extends LaravelServiceProvider
{
    public function boot()
    {
        Auth::extend('jwt', function ($app, $name, array $config) {
            $guard = new JWTGuard(
                $app['tymon.jwt'],
                $app['auth']->createUserProvider($config['provider']),
                $app['request']
            );

            $app->refresh('request', $guard, 'setRequest');

            return $guard;
        });
    }
}
