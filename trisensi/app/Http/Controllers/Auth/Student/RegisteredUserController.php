<?php

namespace App\Http\Controllers\Auth\Student;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Models\Student;
use App\Models\AcademicYear;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        $academicYears = AcademicYear::where('is_active', 1)
            ->orderBy('batch', 'desc')
            ->get();

        return Inertia::render('auth/student/register', [
            'academicYears' => $academicYears
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'academic_year_id' => 'required|exists:academic_years,id',
            'nis' => 'required|string|unique:students,nis',
        ]);

        DB::beginTransaction();

        try {
            $studentRole = Role::where('name', 'student')->first();

            if (!$studentRole) {
                return redirect()->back()->withErrors(['error' => 'Role student tidak ditemukan.']);
            }

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);

            Student::create([
                'user_id' => $user->id,
                'role_id' => $studentRole->id,
                'academic_year_id' => $request->academic_year_id,
                'nis' =>  $request->nis,
                'is_active' => 1,
            ]);

            DB::commit();

            return redirect()->route('student.login')->with('success', 'Akun telah terdaftar. Silahkan login.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Terjadi kesalahan: ' . $e->getMessage()]);
        }
    }
}