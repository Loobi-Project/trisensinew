<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use App\Models\Staff;
use App\Models\Teacher;
use App\Models\Semester;
use App\Models\AcademicYear;
use App\Models\Classes;
use App\Models\PresenceRecap;
use App\Models\PresenceStatus;
use App\Models\Presence;

class StaffAdminDashboardController extends Controller
{
    // Dashboard Page
    public function index()
    {
        return inertia('staffadmin/dashboard');
    }

    // Confirm Data Staff Admin Page
    public function updateNipNuptkStaffAdmin(Request $request)
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

    public function updatePasswordStaffAdmin(Request $request)
    {
        $validated = $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = Auth::user();

        if (!$user) {
            return $this->handleResponse($request, false, 'User tidak ditemukan.');
        }

        if (!method_exists($user, 'save')) {
            throw new \Exception('User object does not have a save() method');
        }

        DB::beginTransaction();
        try {
            $user->password = Hash::make($validated['password']);
            $user->save();

            DB::commit();
            return $this->handleResponse($request, true, 'Password berhasil diperbarui!');
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
                ? redirect()->route('staffadmin.dashboard')->with('success', $message)
                : redirect()->back()->withErrors(['error' => $message]);
        }
    }

    // Confirm Data >> Guru Page
    public function indexConfirmTeacher()
    {

        $teachers = Teacher::where('is_active', 0)
            ->whereHas('staff', function ($query) {
                $query->whereNotNull('nip')
                    ->where('nip', '!=', '')
                    ->whereNotNull('nuptk')
                    ->where('nuptk', '!=', '');
            })
            ->with(['staff.user'])
            ->get()
            ->map(function ($teacher) {
                return [
                    'id' => $teacher->id,
                    'name' => optional($teacher->staff->user)->name ?? 'Tidak ada nama',
                    'nip' => optional($teacher->staff)->nip ?? 'Tidak ada NIP',
                    'nuptk' => optional($teacher->staff)->nuptk ?? 'Tidak ada NUPTK',
                    'is_active' => $teacher->is_active,
                ];
            });

        // Mengirimkan data guru ke view menggunakan Inertia
        return Inertia::render('staffadmin/teacher-confirmation', [
            'teachers' => $teachers,
        ]);
    }


    public function updateConfirmTeacher(Teacher $teacher)
    {
        // Mengubah status guru menjadi aktif (is_active = 1)
        $teacher->update(['is_active' => 1]);

        // Redirect kembali ke halaman konfirmasi dengan pesan sukses
        return redirect()->route('confirm.teacher')->with('success', 'Guru berhasil dikonfirmasi.');
    }

    public function getTeacherStaff()
    {
        $staff = Staff::with(['user', 'role', 'teacher'])
            ->whereHas('role', function ($query) {
                $query->where('name', 'staff');
            })
            ->get();

        return response()->json($staff);
    }

    public function indexconfirmStudent()
    {
        return inertia('staffadmin/student-confirmation');
    }

    public function subjects()
    {
        return inertia('staffadmin/subjects');
    }

    // Semester Page
    public function semester()
    {
        $semesters = Semester::all();

        return inertia('staffadmin/semester', [
            'semesters' => $semesters
        ]);
    }

    public function storesemester(Request $request)
    {
        $request->validate([
            'batch' => ['required', 'string', 'regex:/^[0-9\/]*$/'],
        ]);

        Semester::create([
            'batch' => $request->batch,
        ]);

        return redirect()->back()->with('success', 'Semester berhasil ditambahkan');
    }

    public function updatesemester(Request $request, Semester $semester)
    {
        $request->validate([
            'batch' => ['required', 'string', 'regex:/^[0-9\/]*$/'],
        ]);

        $semester->update([
            'batch' => $request->batch,
        ]);

        return redirect()->back()->with('success', 'Semester berhasil diperbarui');
    }

    public function destroysemester(Semester $semester)
    {
        $semester->delete();

        return redirect()->back()->with('success', 'Semester berhasil dihapus');
    }

    // Academic Year Page
    public function academicYear()
    {
        $academicYears = AcademicYear::all();

        return inertia('staffadmin/academic-year', [
            'academicYears' => $academicYears
        ]);
    }

    public function storeacademicyear(Request $request)
    {
        $request->validate([
            'batch' => ['required', 'integer'],
            'description' =>  ['required', 'string', 'regex:/^\d{4}\/\d{4}$/'],
        ]);

        AcademicYear::create([
            'batch' => $request->batch,
            'description' => $request->description,
            'is_active' => 1,
        ]);

        return redirect()->back()->with('success', 'Tahun Ajaran berhasil ditambahkan');
    }

    public function updateacademicyear(Request $request, AcademicYear $academicYear)
    {
        $request->validate([
            'batch' => ['required', 'integer'],
            'description' =>  ['required', 'string', 'regex:/^\d{4}\/\d{4}$/'],
        ]);

        $academicYear->update([
            'batch' => $request->batch,
            'description' => $request->description,
        ]);

        return redirect()->back()->with('success', 'Tahun Ajaran berhasil diupdate');
    }

    public function destroyacademicyear(AcademicYear $academicYear)
    {
        $academicYear->delete();

        return redirect()->back()->with('success', 'Tahun Ajaran berhasil dihapus');
    }

    // Class Page
    public function class()
    {
        $classes = Classes::all();

        return inertia('staffadmin/class', [
            'classes' => $classes
        ]);
    }

    public function storeclass(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        Classes::create([
            'name' => $request->name,
        ]);

        return redirect()->back()->with('success', 'Kelas berhasil ditambahkan');
    }

    public function updateclass(Request $request, Classes $classroom)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $classroom->update([
            'name' => $request->name,
        ]);

        return redirect()->back()->with('success', 'Kelas berhasil diperbarui');
    }

    public function destroyclass(Classes $classroom)
    {
        $classroom->delete();

        return redirect()->back()->with('success', 'Kelas berhasil dihapus');
    }

    // Presention QR Controller

    public function scanQrAttendance()
    {
        return inertia('staffadmin/scan-qr-attendance');
    }

    public function processQrAttendance(Request $request)
    {
        $validated = $request->validate([
            'presence_id' => 'required|exists:presence,id',
        ]);

        DB::beginTransaction();
        try {
            $presence = Presence::with('student.user')->findOrFail($validated['presence_id']);

            // Cari ID status "hadir"
            $hadirStatus = PresenceStatus::where('name', 'Hadir')->first();
            if (!$hadirStatus) {
                throw new \Exception('Status "hadir" tidak ditemukan.');
            }

            // Cek apakah sudah ada presence_recap
            $existingRecord = PresenceRecap::where('presence_id', $validated['presence_id'])->first();

            if ($existingRecord) {
                $existingRecord->update([
                    'presence_status_id' => $hadirStatus->id,
                    'status' => true, // boolean true
                    'timestamp' => now(),
                ]);
                $message = 'kehadiran telah diperbarui!';
            } else {
                PresenceRecap::create([
                    'presence_id' => $validated['presence_id'],
                    'presence_status_id' => $hadirStatus->id,
                    'status' => true, // boolean true
                    'timestamp' => now(),
                ]);
                $message = 'kehadiran berhasil dicatat!';
            }

            $studentName = optional($presence->student?->user)->name ?? 'Siswa';

            DB::commit();
            return $this->handleResponse($request, true, "{$studentName} {$message}");
        } catch (\Exception $e) {
            DB::rollBack();
            logger()->error($e);
            return $this->handleResponse($request, false, 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }


    public function attendanceRecords()
    {
        $records = PresenceRecap::with([
            'presence.student.user', 
            'presence.student.academicYear', 
            'presence.classes', 
            'presence.semester', 
            'presenceStatus'
        ])
            ->orderBy('timestamp', 'desc')
            ->get()
            ->map(function ($recap) {
                return [
                    'id' => $recap->id,
                    'student_name' => optional(optional(optional($recap->presence)->student)->user)->name ?? 'Tidak diketahui',
                    'status' => $recap->status,
                    'status_name' => optional($recap->presenceStatus)->name ?? 'Tidak diketahui',
                    'timestamp' => $recap->timestamp,
                    'batch' => optional(optional(optional($recap->presence)->student)->academicYear)->batch ?? 'N/A',
                    'class_name' => optional(optional($recap->presence)->classes)->name ?? 'N/A',
                    'semester' => optional(optional($recap->presence)->semester)->batch ?? 'N/A',
                ];
            });
        
        return inertia('staffadmin/attendance-records', [
            'records' => $records
        ]);
    }
}