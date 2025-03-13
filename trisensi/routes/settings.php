<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\PasswordControllerSuperAdmin;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\ProfileControllerSuperAdmin;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::redirect('settings', 'settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('password.edit');
    Route::put('settings/password', [PasswordController::class, 'update'])->name('password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance');
});

Route::middleware('auth')->group(function () {
    Route::redirect('settings', 'settings/profile-superadmin');

    Route::get('settings/superadmin/profile-superadmin', [ProfileControllerSuperAdmin::class, 'edit'])->name('profile.edit-superadmin');
    Route::patch('settings/superadmin/profile-superadmin', [ProfileControllerSuperAdmin::class, 'update'])->name('profile.update-superadmin');
    Route::delete('settings/superadmin/profile-superadmin', [ProfileControllerSuperAdmin::class, 'destroy'])->name('profile.destroy-superadmin');

    Route::get('settings/superadmin/password-superadmin', [PasswordControllerSuperAdmin::class, 'edit'])->name('password.edit-superadmin');
    Route::put('settings/superadmin/password-superadmin', [PasswordControllerSuperAdmin::class, 'update'])->name('password.update-superadmin');

    Route::get('settings/superadmin/appearance-superadmin', function () {
        return Inertia::render('settings/superadmin/appearance-superadmin');
    })->name('appearance');
});

Route::middleware('auth')->group(function () {
    Route::redirect('settings', 'settings/profile-staffadmin');

    Route::get('settings/superadmin/profile-superadmin', [ProfileControllerSuperAdmin::class, 'edit'])->name('profile.edit-superadmin');
    Route::patch('settings/superadmin/profile-superadmin', [ProfileControllerSuperAdmin::class, 'update'])->name('profile.update-superadmin');
    Route::delete('settings/superadmin/profile-superadmin', [ProfileControllerSuperAdmin::class, 'destroy'])->name('profile.destroy-superadmin');

    Route::get('settings/superadmin/password-superadmin', [PasswordControllerSuperAdmin::class, 'edit'])->name('password.edit-superadmin');
    Route::put('settings/superadmin/password-superadmin', [PasswordControllerSuperAdmin::class, 'update'])->name('password.update-superadmin');

    Route::get('settings/superadmin/appearance-superadmin', function () {
        return Inertia::render('settings/superadmin/appearance-superadmin');
    })->name('appearance');
});