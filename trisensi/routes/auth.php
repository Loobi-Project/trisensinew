<?php
use App\Http\Controllers\Auth\AuthenticatedSessionController;
// Student auth controllers
use App\Http\Controllers\Auth\Student\AuthenticatedSessionStudentController;
use App\Http\Controllers\Auth\Student\RegisteredUserController;

// Regular auth controllers
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\VerifyEmailController;

// Admin and teacher controllers
use App\Http\Controllers\Auth\SuperAdmin\SuperAdminAuthController;
use App\Http\Controllers\Auth\StaffAdmin\StaffAdminAuthController;
use App\Http\Controllers\Auth\Teacher\StaffTeacherAuthController;
use App\Http\Controllers\Auth\Teacher\RegisteredTeacherController;
use App\Http\Controllers\StaffAdminDashboardController;
use App\Http\Controllers\StaffTeacherDashboardController;

// Models and utils
use Illuminate\Support\Facades\DB;
use App\Models\Staff;
use App\Models\User;
use App\Models\SuperAdmin;
use App\Models\Student;
use App\Models\Role;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

// Common auth routes (available for everyone)
Route::middleware('guest')->group(function () {
    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');
});

// Common auth routes for verified users
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

// Student routes
Route::prefix('student')->group(function () {
    Route::middleware('guest')->group(function () {
        Route::get('/register', [RegisteredUserController::class, 'create'])
            ->name('student.register');
        Route::post('/register', [RegisteredUserController::class, 'store']);

        Route::get('/login', [AuthenticatedSessionStudentController::class, 'create'])
            ->name('student.login');
        Route::post('/login', [AuthenticatedSessionStudentController::class, 'store']);
    });

    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('student.logout');

    Route::middleware('auth')->group(function () {
        Route::get('/dashboard', function () {
            $user = Auth::user();

            // Pastikan user terdaftar di tabel users
            if (!User::where('id', $user->id)->exists()) {
                abort(403, 'Unauthorized');
            }

            // Pastikan user memiliki student record
            $student = Student::where('user_id', $user->id)->first();
            if (!$student) {
                abort(403, 'Unauthorized');
            }

            // Pastikan role yang dimiliki adalah "student"
            $role = Role::where('id', $student->role_id)->where('name', 'student')->first();
            if (!$role) {
                abort(403, 'Unauthorized');
            }

            // ✅ Render dashboard student menggunakan Inertia
            return Inertia::render('student/dashboard');
        })->name('student.dashboard');

        Route::get('/get-detect-student-status', function () {
            $user = Auth::user();

            // Ambil data student berdasarkan user_id
            $student = Student::where('user_id', $user->id)->first();

            if (!$student) {
                return response()->json(['error' => 'Student not found'], 404);
            }

            // Cek apakah NIS sudah diisi dan status aktif
            $nis = $student->nis;
            $isActive = $student->is_active;

            return response()->json([
                'nis' => $nis,
                'is_active' => $isActive,
                'is_complete' => !empty($nis) && $isActive == 1,
            ]);
        })->name('student.get-detect-student-status');
    });
});

// SuperAdmin routes
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

// StaffAdmin routes
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
            $user = Auth::user();

            // Pastikan user terdaftar di tabel users
            if (!User::where('id', $user->id)->exists()) {
                abort(403, 'Unauthorized');
            }

            // Pastikan user_id ada di tabel staff
            $staffAdmin = Staff::where('user_id', $user->id)->first();
            if (!$staffAdmin) {
                abort(403, 'Unauthorized');
            }

            // Pastikan role yang dimiliki adalah "staff"
            $role = Role::where('id', $staffAdmin->role_id)->where('name', 'staff')->first();
            if (!$role) {
                abort(403, 'Unauthorized');
            }

            // Pastikan staff_id ada dalam tabel admin_staff
            if (!DB::table('admin_staffs')->where('staff_id', $staffAdmin->id)->exists()) {
                abort(403, 'Unauthorized');
            }

            // ✅ Render dashboard staffadmin menggunakan Inertia
            return Inertia::render('staffadmin/dashboard');
        })->name('staffadmin.dashboard');

        Route::get('/get-detect-nip-nuptk-staffadmin', function () {
            $user = Auth::user();

            // Ambil data staff berdasarkan user_id
            $staffAdmin = Staff::where('user_id', $user->id)->first();

            if (!$staffAdmin) {
                return response()->json(['error' => 'Staff not found'], 404);
            }

            // Cek apakah NIP dan NUPTK sudah diisi
            $nip = $staffAdmin->nip;
            $nuptk = $staffAdmin->nuptk;

            return response()->json([
                'nip' => $nip,
                'nuptk' => $nuptk,
                'is_complete' => !empty($nip) && !empty($nuptk),
            ]);
        })->name('staffadmin.get-detect-nip-nuptk-staffadmin');
        Route::post('/update-password-staffadmin', [StaffAdminDashboardController::class, 'updatePasswordStaffAdmin'])
            ->name('staffadmin.update-password-staffadmin');
    });

    Route::post('/update-nip-nuptk-staffadmin', [StaffAdminDashboardController::class, 'updateNipNuptkStaffAdmin'])
        ->name('staffadmin.update-nip-nuptk-staffadmin');
});

// StaffTeacher routes
Route::prefix('staffteacher')->group(function () {
    Route::middleware('guest')->group(function () {
        Route::get('/login', function () {
            return Inertia::render('auth/staffteacher/staffteacher-login');
        })->name('staffteacher.login');

        Route::post('/login', [StaffTeacherAuthController::class, 'login']);
    });

    Route::get('/register', function () {
        return Inertia::render('auth/staffteacher/staffteacher-register');
    })->name('staffteacher.register');
    Route::post('/register', [RegisteredTeacherController::class, 'store']);

    Route::post('/logout', [StaffTeacherAuthController::class, 'logout'])->name('staffteacher.logout');

    Route::middleware('auth')->group(function () {
        Route::get('/dashboard', function () {
            $user = Auth::user();

            // Pastikan user terdaftar di tabel users
            if (!User::where('id', $user->id)->exists()) {
                abort(403, 'Unauthorized');
            }

            // Pastikan user_id ada di tabel staff
            $staffTeacher = Staff::where('user_id', $user->id)->first();
            if (!$staffTeacher) {
                abort(403, 'Unauthorized');
            }

            // Pastikan role yang dimiliki adalah "staff"
            $role = Role::where('id', $staffTeacher->role_id)->where('name', 'staff')->first();
            if (!$role) {
                abort(403, 'Unauthorized');
            }

            // Pastikan staff_id ada dalam tabel teacher_staff
            if (!DB::table('teachers')->where('staff_id', $staffTeacher->id)->exists()) {
                abort(403, 'Unauthorized');
            }

            // ✅ Render dashboard staffteacher menggunakan Inertia
            return Inertia::render('staffteacher/dashboard');
        })->name('staffteacher.dashboard');

        Route::get('/get-detect-nip-nuptk-staffteacher', function () {
            $user = Auth::user();

            // Ambil data staff berdasarkan user_id
            $staffTeacher = Staff::where('user_id', $user->id)->first();

            if (!$staffTeacher) {
                return response()->json(['error' => 'Staff not found'], 404);
            }

            // Cek apakah NIP dan NUPTK sudah diisi
            $nip = $staffTeacher->nip;
            $nuptk = $staffTeacher->nuptk;

            return response()->json([
                'nip' => $nip,
                'nuptk' => $nuptk,
                'is_complete' => !empty($nip) && !empty($nuptk),
            ]);
        })->name('staffteacher.get-detect-nip-nuptk-staffteacher');

        Route::get('/get-detect-is-active-teacher', function () {
            $user = Auth::user();

            $staff = $user->staff;

            if (!$staff) {
                return response()->json(['error' => 'Staff not found'], 404);
            }

            $teacher = $staff->teacher;

            if (!$teacher) {
                return response()->json(['error' => 'Teacher not found'], 404);
            }

            $isActive = $teacher->is_active;

            return response()->json([
                'is_active' => $isActive,
            ]);
        });
    });

    Route::post('/update-nip-nuptk-staffteacher', [StaffTeacherDashboardController::class, 'updateNipNuptkStaffTeacher'])
        ->name('staffteacher.update-nip-nuptk-staffteacher');
});