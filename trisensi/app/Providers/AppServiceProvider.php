<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;
use App\Http\Middleware\CheckStaffDetails;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Route::middlewareGroup('check.staff.details', [
            CheckStaffDetails::class,
        ]);
    }
}