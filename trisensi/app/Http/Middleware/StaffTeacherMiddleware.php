<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Staff;
use App\Models\Teacher;

class StaffTeacherMiddleware
{

    public function handle(Request $request, Closure $next)
    {
        if ($request->routeIs('staffteacher.login')) {
            return $next($request);
        }

        if (!Auth::check()) {
            return redirect()->route('staffteacher.login');
        }

        $user = Auth::user();

        // Ambil staff berdasarkan user_id
        $staff = Staff::where('user_id', $user->id)->with('role')->first();

        if (!$staff) {
            return abort(403, 'Anda tidak terdaftar sebagai staff.');
        }

        // Pastikan staff memiliki role
        if (!$staff->role || $staff->role->name !== 'staff') {
            return abort(403, 'Anda tidak memiliki izin sebagai tata usaha.');
        }

        // Cek apakah staff juga merupakan admin
        $teacherStaff = Teacher::where('staff_id', $staff->id)->exists();

        if (!$teacherStaff) {
            return abort(403, 'Anda tidak memiliki akses sebagai guru.');
        }

        return $next($request);
    }
}