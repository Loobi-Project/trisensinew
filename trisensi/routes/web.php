<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Controllers\SuperAdmin\SuperAdminDashboardController;
use App\Http\Middleware\SuperAdminMiddleware;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/staff-role', function () {
    return Inertia::render('staff-role');
})->name('staff-role');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::middleware(['auth', 'verified', SuperAdminMiddleware::class])
    ->prefix('superadmin')
    ->group(function () {
        Route::get('dashboard', function () {
            return Inertia::render('superadmin.dashboard');
        })->name('superadmin.dashboard');
    });

Route::middleware(['auth', SuperAdminMiddleware::class])->prefix('superadmin')->group(function () {
    Route::get('/adm', [SuperAdminDashboardController::class, 'createStaff'])->name('superadmin.adm');
    Route::post('/adm/create-staff', [SuperAdminDashboardController::class, 'store'])->name('superadmin.create-staff');
    Route::get('/adm/get-staff', [SuperAdminDashboardController::class, 'getStaff'])->name('superadmin.get-staff');
    Route::get('/adm/count-staff', [SuperAdminDashboardController::class, 'countStaff'])->name('superadmin.count-staff');
    Route::delete('/adm/delete-staff/{id}', [SuperAdminDashboardController::class, 'deleteStaff'])->name('superadmin.delete-staff');
    Route::post('/adm/delete-staff-multiple', [SuperAdminDashboardController::class, 'deleteMultipleStaff'])->name('superadmin.delete-staff-multiple');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';