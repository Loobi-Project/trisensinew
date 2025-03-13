<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AdminStaff;
use App\Models\User;
use App\Models\Role;
use App\Models\Staff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SuperAdminDashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('SuperAdmin/Dashboard');
    }

    public function createStaff(): Response
    {
        return Inertia::render('superadmin/CreateStaff');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
        ]);

        DB::beginTransaction();

        try {
            $staffRole = Role::where('name', 'staff')->first();

            if (!$staffRole) {
                return redirect()->back()->withErrors(['error' => 'Role staff tidak ditemukan.']);
            }

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
            ]);

            $staff =  Staff::create([
                'user_id' => $user->id,
                'role_id' => $staffRole->id,
                'nip' => null,
                'nuptk' => null,
            ]);

            AdminStaff::create([
                'staff_id' => $staff->id,
                'is_active' => true,
            ]);

            DB::commit();

            return redirect()->route('superadmin.adm')->with('success', 'Akun staff berhasil dibuat!');
        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()->back()->withErrors(['error' => 'Terjadi kesalahan: ' . $e->getMessage()]);
        }
    }

    public function getStaff()
    {
        $staff = Staff::with(['user', 'role', 'adminStaff'])
            ->whereHas('role', function ($query) {
                $query->where('name', 'staff');
            })
            ->get();

        return response()->json($staff);
    }

    public function countStaff()
    {
        $total = Staff::whereHas('role', function ($query) {
                $query->where('name', 'staff');
            })
            ->whereHas('adminStaff') 
            ->count();
    
        return response()->json(['total' => $total]);
    }
    


    public function deleteStaff($id)
    {
        try {
            DB::beginTransaction();

            $staff = Staff::findOrFail($id);
            $userId = $staff->user_id;

            $staff->delete();
            User::where('id', $userId)->delete();

            DB::commit();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    public function deleteMultipleStaff(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:staff,id',
        ]);

        try {
            DB::beginTransaction();

            $staffIds = $request->ids;
            $userIds = [];

            // Get all user IDs first
            $staffRecords = Staff::whereIn('id', $staffIds)->get();
            foreach ($staffRecords as $staff) {
                $userIds[] = $staff->user_id;
            }

            // Delete staff records
            Staff::whereIn('id', $staffIds)->delete();

            // Delete related user records
            User::whereIn('id', $userIds)->delete();

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Data berhasil dihapus']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}