<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Student;

class StudentMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->routeIs('student.login')) {
            return $next($request);
        }

        if (!Auth::check()) {
            return redirect()->route('student.login');
        }

        $user = Auth::user();

        // Ambil student berdasarkan user_id
        $student = Student::where('user_id', $user->id)->with('role')->first();

        if (!$student) {
            return abort(403, 'Anda tidak terdaftar sebagai pelajar.');
        }

        if (!$student->role || $student->role->name !== 'student') {
            return abort(403, 'Anda tidak memiliki izin sebagai pelajar.');
        }

        $request->merge(['student' => $student]);

        return $next($request);
    }
}