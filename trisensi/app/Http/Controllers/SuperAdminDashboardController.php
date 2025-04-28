<?php

namespace App\Http\Controllers;

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
        return Inertia::render('superadmin/create-staff');
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

            return redirect()->route('superadmin.spadm')->with('success', 'Akun staff berhasil dibuat!');
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
            'ids.*' => 'integer|exists:staffs,id',
        ]);

        DB::beginTransaction();
        try {
            $staffIds = $request->ids;

            $staffRecords = Staff::whereIn('id', $staffIds)->get();

            if ($staffRecords->isEmpty()) {
                return response()->json(['error' => 'Staff data not found.'], 404);
            }

            $userIds = $staffRecords->pluck('user_id')->toArray();

            AdminStaff::whereIn('staff_id', $staffIds)->delete();

            Staff::whereIn('id', $staffIds)->delete();

            User::whereIn('id', $userIds)->delete();

            DB::commit();

            return response()->json(['success' => true, 'message' => 'Data berhasil dihapus']);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['error' => 'Terjadi kesalahan saat menghapus data: ' . $e->getMessage()], 500);
        }
    }
}