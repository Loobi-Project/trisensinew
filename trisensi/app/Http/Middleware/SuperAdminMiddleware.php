<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\SuperAdmin;
use App\Models\Role;

class SuperAdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->routeIs('superadmin.login')) {
            return $next($request);
        }

        if (!Auth::check()) {
            return redirect()->route('superadmin.login');
        }

        $user = Auth::user();

        $superAdmin = SuperAdmin::where('user_id', $user->id)->first();

        if (!$superAdmin) {
            abort(403, 'Unauthorized');
        }

        $roleExists = Role::where('id', $superAdmin->role_id)
                          ->where('name', 'super_admin')
                          ->exists();

        if (!$roleExists) {
            abort(403, 'Unauthorized');
        }

        return $next($request);
    }
}