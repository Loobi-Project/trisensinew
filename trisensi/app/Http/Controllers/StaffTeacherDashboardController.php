<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Staff;

class StaffTeacherDashboardController extends Controller
{

    public function index()
    {
        return inertia('/staffteacher/dashboard');
    }

    public function updateNipNuptkStaffTeacher(Request $request)
    {
        $validated = $request->validate([
            'nip' => 'required|string|max:20',
            'nuptk' => 'required|string|max:20',
        ]);

        $user = Auth::user();

        if (!$user) {
            return $this->handleResponse($request, false, 'User tidak ditemukan.');
        }

        $staff = Staff::where('user_id', $user->id)->first();

        if (!$staff) {
            return $this->handleResponse($request, false, 'Staff tidak ditemukan.');
        }

        DB::beginTransaction();
        try {
            $staff->update([
                'nip' => $validated['nip'],
                'nuptk' => $validated['nuptk'],
            ]);

            DB::commit();
            return $this->handleResponse($request, true, 'NIP dan NUPTK berhasil diperbarui!');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->handleResponse($request, false, 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }
    
    private function handleResponse($request, $success, $message)
    {
        if ($request->expectsJson()) {
            return response()->json([
                'success' => $success,
                'message' => $message,
            ], $success ? 200 : 400);
        } else {
            return $success
                ? redirect()->route('staffteacher.dashboard')->with('success', $message)
                : redirect()->back()->with('error', $message);
        }
    }
}