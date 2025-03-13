<?php

namespace App\Http\Controllers\SuperAdmin\Auth;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use App\Models\SuperAdmin;

class SuperAdminAuthController extends Controller
{
    public function showLoginForm()
    {
        return view('auth.superadmin-login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'admin_code' => 'required|string',
        ]);

        $superAdmin = SuperAdmin::where('admin_code', $request->admin_code)
            ->with('role') 
            ->first();

        if ($superAdmin && $superAdmin->role->name === 'super_admin') {
            Auth::login($superAdmin->user);

            return redirect()->route('superadmin.dashboard');
        }

        return back()->withErrors(['admin_code' => 'Invalid admin code or role']);
    }
}