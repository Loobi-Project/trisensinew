<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\SuperAdmin;
use App\Models\Role;

class SuperAdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        // Izinkan akses ke halaman login tanpa harus login
        if ($request->routeIs('superadmin.login')) {
            return $next($request);
        }

        // Jika user belum login, arahkan ke halaman login
        if (!Auth::check()) {
            return redirect()->route('superadmin.login')->with('error', 'Silakan login terlebih dahulu.');
        }

        $user = Auth::user();

        // Periksa apakah user adalah Super Admin
        $superAdmin = SuperAdmin::where('user_id', $user->id)->first();

        if (!$superAdmin) {
            abort(403, 'Akses ditolak! Anda tidak memiliki izin sebagai Super Admin.');
        }

        // Periksa apakah role pengguna benar-benar "super_admin"
        $roleExists = Role::where('id', $superAdmin->role_id)
                          ->where('name', 'super_admin')
                          ->exists();

        if (!$roleExists) {
            abort(403, 'Akses ditolak! Anda tidak memiliki peran yang sesuai.');
        }

        return $next($request);
    }
}