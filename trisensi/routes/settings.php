<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\PasswordControllerSuperAdmin;
use App\Http\Controllers\Settings\PasswordControllerStaffAdmin;
use App\Http\Controllers\Settings\PasswordControllerStaffTeacher;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\ProfileControllerSuperAdmin;
use App\Http\Controllers\Settings\ProfileControllerStaffAdmin;
use App\Http\Controllers\Settings\ProfileControllerStaffTeacher;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

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

    Route::get('settings/staffadmin/profile-staffadmin', [ProfileControllerStaffAdmin::class, 'edit'])->name('profile.edit-staffadmin');
    Route::patch('settings/staffadmin/profile-staffadmin', [ProfileControllerStaffAdmin::class, 'update'])->name('profile.update-staffadmin');
    Route::delete('settings/staffadmin/profile-staffadmin', [ProfileControllerStaffAdmin::class, 'destroy'])->name('profile.destroy-staffadmin');

    Route::get('settings/staffadmin/password-staffadmin', [PasswordControllerStaffAdmin::class, 'edit'])->name('password.edit-staffadmin');
    Route::put('settings/staffadmin/password-staffadmin', [PasswordControllerStaffAdmin::class, 'update'])->name('password.update-staffadmin');

    Route::get('settings/staffadmin/appearance-staffadmin', function () {
        return Inertia::render('settings/staffadmin/appearance-staffadmin');
    })->name('appearance');
});

Route::middleware('auth')->group(function () {
    Route::redirect('settings', 'settings/profile-staffteacher');
    Route::get('settings/staffteacher/profile-staffteacher', [ProfileControllerStaffTeacher::class, 'edit'])->name('profile.edit-staffteacher');
    Route::patch('settings/staffteacher/profile-staffteacher', [ProfileControllerStaffTeacher::class, 'update'])->name('profile.update-staffteacher');
    Route::delete('settings/staffteacher/profile-staffteacher', [ProfileControllerStaffTeacher::class, 'destroy'])->name('profile.destroy-staffteacher');

    Route::get('settings/staffteacher/password-staffteacher', [PasswordControllerStaffTeacher::class, 'edit'])->name('password.edit-staffteacher');
    Route::put('settings/staffteacher/password-staffteacher', [PasswordControllerStaffTeacher::class, 'update'])->name('password.update-staffteacher');

    Route::get('settings/staffteacher/appearance-staffteacher', function () {
        return Inertia::render('settings/staffteacher/appearance-staffteacher');
    })->name('appearance');
});

Route::middleware('auth')->group(function () {
    Route::redirect('settings', 'settings/profile-student');
    Route::get('settings/student/profile-student', [ProfileController::class, 'edit'])->name('profile.edit-student');
    Route::patch('settings/student/profile-student', [ProfileController::class, 'update'])->name('profile.update-student');
    Route::delete('settings/student/profile-student', [ProfileController::class, 'destroy'])->name('profile.destroy-student');

    Route::get('settings/student/password-student', [PasswordController::class, 'edit'])->name('password.edit-student');
    Route::put('settings/student/password-student', [PasswordController::class, 'update'])->name('password.update-student');

    Route::get('settings/student/appearance-student', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance');
});

Route::middleware('auth')->group(function () {
    Route::redirect('settings', 'settings/profile');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});