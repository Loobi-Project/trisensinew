<?php

namespace App\Http\Controllers\StaffAdmin\Auth;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use App\Models\AdminStaff;
use App\Models\Staff;
use App\Models\User;

class StaffAdminAuthController extends Controller
{
    public function showLoginForm()
    {
        return view('auth.staffadmin-login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);
    
        // Cari user berdasarkan email
        $user = User::where('email', $request->email)->first();
    
        if (!$user) {
            return back()->withErrors(['email' => 'Email tidak ditemukan.']);
        }
    
        // Cari staff berdasarkan user_id
        $staff = Staff::where('user_id', $user->id)->with('role')->first();
    
        if (!$staff) {
            return back()->withErrors(['email' => 'Anda tidak terdaftar sebagai staff.']);
        }
    
        // Periksa apakah staff memiliki role "staff"
        if ($staff->role->name !== 'staff') {
            return back()->withErrors(['email' => 'Anda tidak memiliki izin sebagai tata usaha.']);
        }
    
        // Cek apakah staff_id terdaftar di admin_staff
        $adminStaff = AdminStaff::where('staff_id', $staff->id)->first();
    
        if (!$adminStaff) {
            return back()->withErrors(['email' => 'Anda tidak memiliki akses sebagai admin staff.']);
        }
    
        // Autentikasi pengguna
        if (Auth::attempt($credentials)) {
            return redirect()->route('staffadmin.dashboard');
        }
    
        return back()->withErrors(['password' => 'Kata sandi salah.']);
    }    

    public function logout()
    {
        Auth::logout();
        return redirect()->route('staffadmin.login');
    }
}