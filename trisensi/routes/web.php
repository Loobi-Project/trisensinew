<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\SuperAdminDashboardController;
use App\Http\Controllers\StaffAdminDashboardController;
use App\Http\Controllers\StaffTeacherDashboardController;
use App\Http\Controllers\StudentDashboardController;
use App\Http\Middleware\SuperAdminMiddleware;
use App\Http\Middleware\StaffAdminMiddleware;
use App\Http\Middleware\StaffTeacherMiddleware;
use App\Http\Middleware\StudentMiddleware;

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
    Route::get('/spadm', [SuperAdminDashboardController::class, 'createStaff'])->name('superadmin.spadm');
    Route::post('/spadm/create-staff', [SuperAdminDashboardController::class, 'store'])->name('superadmin.create-staff');
    Route::get('/spadm/get-staff', [SuperAdminDashboardController::class, 'getStaff'])->name('superadmin.get-staff');
    Route::get('/spadm/count-staff', [SuperAdminDashboardController::class, 'countStaff'])->name('superadmin.count-staff');
    Route::get('/spadm/count-teachers', [SuperAdminDashboardController::class, 'countTeachers']);
    Route::get('/spadm/count-students', [SuperAdminDashboardController::class, 'countStudents']);
    Route::delete('/spadm/delete-staff/{id}', [SuperAdminDashboardController::class, 'deleteStaff'])->name('superadmin.delete-staff');
    Route::post('/spadm/delete-staff-multiple', [SuperAdminDashboardController::class, 'deleteMultipleStaff'])->name('superadmin.delete-staff-multiple');
});

Route::middleware(['auth', StaffAdminMiddleware::class])->prefix('staffadmin')->group(function () {
    Route::get('/teacher-confirmation', [StaffAdminDashboardController::class, 'indexConfirmTeacher'])
        ->name('confirm.teacher');
    Route::post('/teacher/{teacher}/confirm', [StaffAdminDashboardController::class, 'updateConfirmTeacher'])
        ->name('confirm.teacher.update');
    Route::get('/get-teacher', [StaffAdminDashboardController::class, 'getTeacherStaff'])
        ->name('staffadmin.get-teacher');
    // Route for Student Confirmation
    Route::get('/student-confirmation', [StaffAdminDashboardController::class, 'indexconfirmStudent'])
        ->name('staffadmin.confirm-student');
    Route::post('/student/{student}/confirm', [StaffAdminDashboardController::class, 'updateConfirmStudent'])
        ->name('confirm.student.update');
    Route::get('/get-student', [StaffAdminDashboardController::class, 'getStudent'])
        ->name('staffadmin.get-student');
    // Subject Route Page
    Route::get('/subjects', [StaffAdminDashboardController::class, 'subjects'])
        ->name('staffadmin.subjects');
    Route::post('/subjects', [StaffAdminDashboardController::class, 'storeSubject'])
        ->name('staffadmin.subjects.store');
    Route::put('/subjects/{subject}', [StaffAdminDashboardController::class, 'updateSubject'])
        ->name('staffadmin.subjects.update');
    Route::delete('/subjects/{subject}', [StaffAdminDashboardController::class, 'deleteSubject'])
        ->name('staffadmin.subjects.delete');
    Route::delete('/subjects', [StaffAdminDashboardController::class, 'bulkDeleteSubjects'])
        ->name('staffadmin.subjects.bulk-delete');
    // Semester Route PageF
    Route::get('/semester', [StaffAdminDashboardController::class, 'semester'])
        ->name('staffadmin.semester');
    Route::post('/semester', [StaffAdminDashboardController::class, 'storesemester'])
        ->name('staffadmin.store-semester');
    Route::put('/semester/{semester}', [StaffAdminDashboardController::class, 'updatesemester'])
        ->name('staffadmin.update-semester');
    Route::delete('/semester/{semester}', [StaffAdminDashboardController::class, 'destroysemester'])
        ->name('staffadmin.semester-destroy');
    // Academic Year Route Page
    Route::get('/academic-year', [StaffAdminDashboardController::class, 'academicYear'])
        ->name('staffadmin.academic-year');
    Route::post('/academic-year/store', [StaffAdminDashboardController::class, 'storeacademicyear'])
        ->name('staffadmin.store-academic-year');
    Route::put('/academic-year/update/{academicYear}', [StaffAdminDashboardController::class, 'updateacademicyear'])
        ->name('staffadmin.update-academic-year');
    Route::delete('/academic-year/destroy/{academicYear}', [StaffAdminDashboardController::class, 'destroyacademicyear'])
        ->name('staffadmin.destroy-academic-year');
    // Class Route Page
    Route::get('/class', [StaffAdminDashboardController::class, 'class'])
        ->name('staffadmin.class');
    Route::post('/class/store', [StaffAdminDashboardController::class, 'storeclass'])
        ->name('staffadmin.store-class');
    Route::put('/class/update/{classroom}', [StaffAdminDashboardController::class, 'updateclass'])
        ->name('staffadmin.update-class');
    Route::delete('/class/destroy/{classroom}', [StaffAdminDashboardController::class, 'destroyclass'])
        ->name('staffadmin.destroy-class');
    // QR Student Page
    Route::get('/scan-qr-attendance', [StaffAdminDashboardController::class, 'scanQrAttendance'])
        ->name('staffadmin.scan.qr.attendance');
    Route::post('/process-qr-attendance', [StaffAdminDashboardController::class, 'processQrAttendance'])
        ->name('staffadmin.process.qr.attendance');
    Route::get('/attendance-records', [StaffAdminDashboardController::class, 'attendanceRecords'])
        ->name('staffadmin.attendance.records');
    Route::get('/attendance-template', [StaffAdminDashboardController::class, 'template'])
        ->name('staffadmin.attendance.template');
    Route::post('/attendance-template', [StaffAdminDashboardController::class, 'storeTemplate'])
        ->name('staffadmin.attendance.template.store');
    Route::post('/attendance-template/update/{id}', [StaffAdminDashboardController::class, 'update'])
        ->name('staffadmin.attendance.template.update');
    Route::post('/attendance-template/bulk-delete', [StaffAdminDashboardController::class, 'bulkDelete'])
        ->name('staffadmin.attendance.template.bulk-delete');
    // Route untuk menjalankan absensi otomatis secara manual
    Route::post('/attendance/process-automatic-absence', [StaffAdminDashboardController::class, 'processAutomaticAbsence'])
        ->name('staffadmin.attendance.process-automatic-absence');
    Route::put('/attendance/update-status', [StaffAdminDashboardController::class, 'updateAttendanceStatus'])
        ->name('staffadmin.attendance.update-status');
    Route::get('/attendance/recaps', [StaffAdminDashboardController::class, 'getAttendanceRecapForEdit'])
        ->name('staffadmin.attendance.get-recaps');
});

Route::middleware(['auth', StaffTeacherMiddleware::class])->prefix('staffteacher')->group(function () {
    Route::get('/dashboard', [StaffTeacherDashboardController::class, 'index'])
        ->name('staffteacher.dashboard');
    Route::get('/presence-recap-entry', [StaffTeacherDashboardController::class, 'indexRecaps'])
        ->name('staffteacher.presence-recap-entry');
    Route::post('/presence-recap/get-students', [StaffTeacherDashboardController::class, 'getStudentsByClass'])
        ->name('staffteacher.presence-recap.get-students');
    Route::post('/presence-recap/store', [StaffTeacherDashboardController::class, 'storeSubjectPresenceRecaps'])
        ->name('staffteacher.presence-recap.store');
    Route::delete('/presence-recap/delete', [StaffTeacherDashboardController::class, 'deleteSubjectPresenceRecaps'])
        ->name('staffteacher.presence-recap.delete');
    Route::post('/presence-recap/get-recapped-students', [StaffTeacherDashboardController::class, 'getRecappedStudents'])
        ->name('staffteacher.presence-recap.get-recapped-students');
});

Route::middleware(['auth', StudentMiddleware::class])->prefix('student')->group(function () {
    // Dashboard route
    Route::get('/dashboard', [StudentDashboardController::class, 'index'])
        ->name('student.dashboard');
    Route::get('/create-presence', [StudentDashboardController::class, 'createPresence'])
        ->name('student.create-presence');
    Route::post('/store-presence', [StudentDashboardController::class, 'store'])
        ->name('student.store-presence');
    Route::get('/select-absence', [StudentDashboardController::class, 'selectAbsenceLetterTemplate'])
        ->name('student.select-letter-absence');
    Route::post('/generate-qr', [StudentDashboardController::class, 'generateQr'])
        ->name('student.generate-qr');
    Route::get('/generate-qr', [StudentDashboardController::class, 'showQr'])
        ->name('student.show-qr');
    Route::get('/get-detect-is-active-student', [StudentDashboardController::class, 'getDetectIsActiveStudent']);
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';