<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\SuperAdmin\Auth\SuperAdminAuthController;
use App\Http\Controllers\StaffAdmin\Auth\StaffAdminAuthController;
use App\Models\SuperAdmin;
use App\Models\Role;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

Route::middleware('guest')->group(function () {
    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register');

    Route::post('register', [RegisteredUserController::class, 'store']);

    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');
});

Route::middleware('auth')->group(function () {
    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});

Route::prefix('superadmin')->group(function () {
    Route::middleware('guest')->group(function () {
        Route::get('/login', function () {
            return Inertia::render('auth/superadmin/superadmin-login');
        })->name('superadmin.login');

        Route::post('/login', [SuperAdminAuthController::class, 'login']);
    });

    Route::post('/logout', [SuperAdminAuthController::class, 'logout'])->name('superadmin.logout');

    Route::get('/dashboard', function () {
        if (!Auth::check()) {
            return redirect()->route('superadmin.login');
        }

        $user = Auth::user();

        $superAdmin = SuperAdmin::where('user_id', $user->id)->first();

        if (!$superAdmin) {
            abort(403, 'Unauthorized');
        }

        $role = Role::where('id', $superAdmin->role_id)->where('name', 'super_admin')->first();

        if (!$role) {
            abort(403, 'Unauthorized');
        }

        // ✅ Render dashboard superadmin menggunakan Inertia
        return Inertia::render('superadmin/dashboard');
    })->name('superadmin.dashboard');
});

Route::prefix('staffadmin')->group(function () {
    Route::middleware('guest')->group(function () {
        Route::get('/login', function () {
            return Inertia::render('auth/staffadmin/staffadmin-login');
        })->name('staffadmin.login');

        Route::post('/login', [StaffAdminAuthController::class, 'login']);
    });

    Route::post('/logout', [StaffAdminAuthController::class, 'logout'])->name('staffadmin.logout');

    Route::middleware('auth')->group(function () {
        Route::get('/dashboard', function () {
            return Inertia::render('staffadmin/dashboard', [
                'user' => Auth::user(),
            ]);
        })->name('staffadmin.dashboard');
    });
});