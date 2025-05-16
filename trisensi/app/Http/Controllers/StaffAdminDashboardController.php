<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use App\Models\AbsenceLetterTemplate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use App\Models\Staff;
use App\Models\Teacher;
use App\Models\Subject;
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

    private function handleResponse($request, $success, $message, $statusType = null)
    {
        if ($request->expectsJson()) {
            return response()->json([
                'success' => $success,
                'message' => $message,
                'status_type' => $statusType,
            ], $success ? 200 : 400);
        } else {
            if ($success) {
                if ($statusType === 'late') {
                    return redirect()->back()->with('warning', $message);
                } else {
                    return redirect()->back()->with('success', $message);
                }
            } else {
                return redirect()->back()->withErrors(['error' => $message]);
            }
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

    // public function subjects()
    // {
    //     return inertia('staffadmin/subjects');
    // }

    public function subjects()
    {
        $subjects = Subject::with('teacher.staff.user')->get();

        $teachers = Teacher::with('staff.user')->where('is_active', true)->get();

        return Inertia::render('staffadmin/subjects', [
            'subjects' => $subjects,
            'teachers' => $teachers
        ]);
    }

    public function storeSubject(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'teacher_id' => 'nullable|exists:teachers,id',
            'is_active' => 'boolean',
        ]);

        Subject::create($validated);

        return redirect()->route('staffadmin.subjects')->with('message', 'Mata pelajaran berhasil ditambahkan');
    }

    public function updateSubject(Request $request, Subject $subject)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'teacher_id' => 'nullable|exists:teachers,id',
            'is_active' => 'boolean',
        ]);

        $subject->update($validated);

        return redirect()->route('staffadmin.subjects')->with('message', 'Mata pelajaran berhasil diperbarui');
    }

    public function deleteSubject(Subject $subject)
    {
        $subject->delete();

        return redirect()->route('staffadmin.subjects')->with('message', 'Mata pelajaran berhasil dihapus');
    }

    public function bulkDeleteSubjects(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:subjects,id',
        ]);

        Subject::whereIn('id', $validated['ids'])->delete();

        return redirect()->route('staffadmin.subjects')->with('message', 'Mata pelajaran berhasil dihapus');
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

        $nowWIB = Carbon::now()->setTimezone('Asia/Jakarta');
        $currentDate = $nowWIB->toDateString();

        $schoolOpenWIB = $nowWIB->copy()->setTime(5, 0);
        $startLateWIB = $nowWIB->copy()->setTime(7, 0);
        $endLateWIB = $nowWIB->copy()->setTime(18, 0);

        if (!$nowWIB->between($schoolOpenWIB, $endLateWIB)) {
            return $this->handleResponse(
                $request,
                false,
                'Presensi hanya bisa dilakukan antara pukul 05:00 hingga 16:00 WIB.'
            );
        }

        DB::beginTransaction();
        try {
            $presence = Presence::with('student.user')->findOrFail($validated['presence_id']);
            $hadirStatus = PresenceStatus::where('name', 'Hadir')->first();
            $lateStatus = PresenceStatus::where('name', 'Terlambat')->first();
            $alfaStatus = PresenceStatus::where('name', 'Alfa')->first();

            if (!$hadirStatus || !$lateStatus || !$alfaStatus) {
                throw new \Exception('Status presensi tidak ditemukan.');
            }

            $studentName = optional($presence->student?->user)->name ?? 'Siswa';

            $existingRecap = PresenceRecap::where('presence_id', $validated['presence_id'])
                ->whereDate('timestamp', $currentDate)
                ->first();

            // Menentukan status berdasarkan waktu scan
            $selectedStatus = $nowWIB->lessThan($startLateWIB) ? $hadirStatus : $lateStatus;

            if ($existingRecap) {
                // Jika siswa sudah memiliki data presensi, periksa apakah statusnya "Alfa"
                if ($existingRecap->presence_status_id == $alfaStatus->id) {
                    // Update status dari Alfa ke Hadir/Terlambat
                    $existingRecap->presence_status_id = $selectedStatus->id;
                    $existingRecap->status = true;
                    $existingRecap->timestamp = now();
                    $existingRecap->save();

                    DB::commit();

                    $statusType = $selectedStatus->name === 'Terlambat' ? 'late' : null;

                    return $this->handleResponse(
                        $request,
                        true,
                        "{$studentName} kehadiran diperbarui menjadi {$selectedStatus->name}.",
                        $statusType
                    );
                } else {
                    // Siswa sudah presensi dengan status selain Alfa
                    return $this->handleResponse(
                        $request,
                        false,
                        "{$studentName} sudah melakukan presensi hari ini."
                    );
                }
            }

            // Jika belum ada data presensi, buat baru
            PresenceRecap::create([
                'presence_id' => $validated['presence_id'],
                'presence_status_id' => $selectedStatus->id,
                'status' => true,
                'timestamp' => now(),
            ]);

            DB::commit();

            $statusType = $selectedStatus->name === 'Terlambat' ? 'late' : null;

            return $this->handleResponse(
                $request,
                true,
                "{$studentName} kehadiran berhasil dicatat sebagai {$selectedStatus->name}.",
                $statusType
            );
        } catch (\Exception $e) {
            DB::rollBack();
            logger()->error($e);
            return $this->handleResponse($request, false, 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }

    public function processAutomaticAbsence(Request $request)
    {
        $nowWIB = Carbon::now()->setTimezone('Asia/Jakarta');
        $currentDate = $nowWIB->toDateString();

        $dayOfWeek = $nowWIB->dayOfWeek;
        $isSchoolDay = ($dayOfWeek >= 1 && $dayOfWeek <= 5);

        if (!$isSchoolDay) {
            return $this->errorResponse($request, 'Tidak perlu mencatat absensi karena bukan hari sekolah (Senin-Jumat).', 400);
        }

        try {
            $alfaStatus = PresenceStatus::where('name', 'Alfa')
                ->where('is_active', true)
                ->first();

            if (!$alfaStatus) {
                return $this->errorResponse($request, 'Status "Alfa" tidak ditemukan atau tidak aktif', 404);
            }

            DB::beginTransaction();

            $studentsWithoutAttendance = DB::table('presence')
                ->select('presence.id')
                ->leftJoin('presence_recaps', function ($join) use ($currentDate) {
                    $join->on('presence.id', '=', 'presence_recaps.presence_id')
                        ->whereDate('presence_recaps.timestamp', '=', $currentDate);
                })
                ->where('presence.is_active', true)
                ->whereNull('presence_recaps.id')
                ->get();

            $studentsCount = $studentsWithoutAttendance->count();

            if ($studentsCount == 0) {
                DB::commit();
                return $this->successResponse($request, "Tidak ada siswa yang perlu dicatat sebagai Alfa", [
                    'processed_count' => 0,
                    'date' => $currentDate,
                ]);
            }

            $recapsToInsert = [];
            $processedCount = 0;

            foreach ($studentsWithoutAttendance as $student) {
                $existingRecap = PresenceRecap::where('presence_id', $student->id)
                    ->whereDate('timestamp', $currentDate)
                    ->first();

                if ($existingRecap) {
                    continue;
                }

                $recapsToInsert[] = [
                    'presence_id' => $student->id,
                    'presence_status_id' => $alfaStatus->id,
                    'status' => false,
                    'timestamp' => $nowWIB,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                $processedCount++;
            }

            if ($processedCount > 0) {
                PresenceRecap::insert($recapsToInsert);
            }

            DB::commit();

            return $this->successResponse($request, "Berhasil mencatat {$processedCount} siswa sebagai Alfa", [
                'processed_count' => $processedCount,
                'date' => $currentDate,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse($request, 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }

    /**
     * Helper method to create consistent error responses
     */
    private function errorResponse(Request $request, string $message, int $statusCode = 500)
    {
        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => $message,
                'error_details' => config('app.debug') ? debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS) : null,
            ], $statusCode);
        }
        return $this->handleResponse($request, false, $message);
    }

    /**
     * Helper method to create consistent success responses
     */
    private function successResponse(Request $request, string $message, array $additionalData = [])
    {
        $responseData = [
            'success' => true,
            'message' => $message,
        ];

        // Merge additional data
        $responseData = array_merge($responseData, $additionalData);

        if ($request->expectsJson()) {
            return response()->json($responseData);
        }
        return $this->handleResponse($request, true, $message, $additionalData);
    }

    /**
     * Attendance Records Page
     *
     * @return \Inertia\Response
     */

    public function attendanceRecords()
    {
        // Ambil semua status kehadiran untuk mapping
        $presenceStatuses = PresenceStatus::all()
            ->keyBy('id')
            ->map(function ($status) {
                return [
                    'id' => $status->id,
                    'name' => $status->name,
                    'description' => $status->description,
                    'absence_letter_id' => $status->absence_letter_id
                ];
            });

        // Ambil semua absence letter untuk mapping
        // $absenceLetters = AbsenceLetter::all()
        //     ->keyBy('id');

        // Ambil data rekap kehadiran dengan semua relasi yang diperlukan
        $records = PresenceRecap::with([
            'presence.student.user',
            'presence.student.academicYear',
            'presence.classes',
            'presence.semester',
            'presenceStatus.absenceLetter',
        ])
            ->orderBy('timestamp', 'desc')
            ->get()
            ->map(function ($recap) use ($presenceStatuses) {
                $statusName = 'Tidak diketahui';
                $absenceType = null;

                if ($recap->presenceStatus) {
                    $statusName = $recap->presenceStatus->name;

                    if (
                        $recap->presenceStatus->absence_letter_id &&
                        isset($absenceLetters[$recap->presenceStatus->absence_letter_id])
                    ) {
                        $absenceType = $absenceLetters[$recap->presenceStatus->absence_letter_id]->name;
                    }
                }

                // Map status ke nilai yang dibutuhkan oleh frontend
                $mappedStatus = $this->mapStatusToFrontend($statusName);

                return [
                    'id' => $recap->id,
                    'student_name' => optional(optional(optional($recap->presence)->student)->user)->name ?? 'Tidak diketahui',
                    'status' => $mappedStatus, // Status untuk perhitungan (present, absent, late)
                    'status_name' => $statusName, // Nama status asli (Hadir, Izin, Sakit, dll)
                    'absence_type' => $absenceType, // Tipe ketidakhadiran jika relevan
                    'timestamp' => $recap->timestamp,
                    'batch' => optional(optional(optional($recap->presence)->student)->academicYear)->batch ?? 'N/A',
                    'class_name' => optional(optional($recap->presence)->classes)->name ?? 'N/A',
                    'semester' => optional(optional($recap->presence)->semester)->batch ?? 'N/A',
                    'student_id' => optional(optional($recap->presence)->student)->id,
                ];
            });

        // Hitung statistik untuk dikirim ke frontend
        $statistics = $this->calculateStatistics($records->toArray());

        // Get all unique batches for filters if needed
        $batches = AcademicYear::pluck('batch')->unique()->values();

        return inertia('staffadmin/attendance-records', [
            'records' => $records,
            'batches' => $batches,
            'statistics' => $statistics // Tambahkan statistik ke data yang dikirim ke frontend
        ]);
    }

    /** 
     * Template Page */

    public function template()
    {
        $templates = AbsenceLetterTemplate::orderBy('timestamp', 'desc')->get()->map(function ($template) {
            return [
                'id' => $template->id,
                'name' => $template->name,
                'file_path' => $template->file_path,
                'timestamp' => Carbon::parse($template->timestamp)->timezone('Asia/Jakarta')->toIso8601String(),
            ];
        });

        return inertia('staffadmin/attendance-template', [
            'templates' => $templates,
        ]);
    }

    public function storeTemplate(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'file' => 'required|file|mimes:pdf,doc,docx|max:2048',
        ]);

        $path = $request->file('file')->store('templates', 'public');

        AbsenceLetterTemplate::create([
            'name' => $validated['name'],
            'file_path' => '/storage/' . $path,
            'timestamp' => Carbon::now(), // simpan timestamp secara manual
        ]);

        return redirect()->route('staffadmin.attendance.template')->with('success', 'Template berhasil diunggah.');
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $template = AbsenceLetterTemplate::findOrFail($id);
        $template->update(['name' => $request->name]);

        return back()->with('success', 'Nama template berhasil diperbarui.');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:absence_letter_template,id',
        ]);

        $templates = AbsenceLetterTemplate::whereIn('id', $request->ids)->get();

        foreach ($templates as $template) {
            if (Storage::exists(str_replace('/storage/', 'public/', $template->file_path))) {
                Storage::delete(str_replace('/storage/', 'public/', $template->file_path));
            }
            $template->delete();
        }

        return back()->with('success', 'Template terpilih berhasil dihapus.');
    }

    /**
     * Get attendance recaps for editing
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */ public function getAttendanceRecapForEdit(Request $request)
    {
        // Validate the date parameter
        $request->validate([
            'date' => 'required|date_format:Y-m-d',
        ]);

        $date = $request->input('date');

        try {
            // Get all presence recaps for the specified date with related data
            $recaps = PresenceRecap::whereDate('timestamp', $date)
                ->with([
                    'presence',
                    'presence.student',
                    'presence.classes',
                    'presenceStatus'
                ])
                ->get();

            // Transform the data to include student and class info
            $formattedRecaps = $recaps->map(function ($recap) {
                return [
                    'id' => $recap->id,
                    'student_name' => $recap->presence->student->name ?? 'Unknown',
                    'student_id' => $recap->presence->student_id ?? null,
                    'class_name' => $recap->presence->classes->name ?? 'Unknown',
                    'class_id' => $recap->presence->classes_id ?? null,
                    'status' => $recap->presenceStatus->name ?? 'Unknown',
                    'status_id' => $recap->presence_status_id,
                    'is_verified' => (bool) $recap->status,
                    'timestamp' => $recap->timestamp,
                ];
            });

            // If the request expects JSON, return JSON response
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $formattedRecaps,
                    'date' => $date,
                    'count' => $formattedRecaps->count()
                ]);
            }

            // Otherwise return Inertia view with data
            return Inertia::render('staffadmin/edit-attendance', [
                'recaps' => $formattedRecaps,
                'date' => $date,
                'count' => $formattedRecaps->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving attendance recaps: ' . $e->getMessage());

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Terjadi kesalahan saat mengambil data rekap: ' . $e->getMessage()
                ], 500);
            }

            return redirect()->back()->withErrors(['error' => 'Terjadi kesalahan saat mengambil data rekap: ' . $e->getMessage()]);
        }
    }

    /**
     * Update attendance status
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateAttendanceStatus(Request $request)
    {
        // Validate request data
        $request->validate([
            'recap_id' => 'required|integer|exists:presence_recaps,id',
            'status_id' => 'required|integer|exists:presence_status,id',
            'is_verified' => 'boolean',
        ]);

        try {
            // Log request data untuk debugging
            \Log::info('Update Attendance Status Request', $request->all());

            // Cari record presensi
            $recap = PresenceRecap::findOrFail($request->recap_id);

            // Log status sebelum diupdate
            \Log::info('Status sebelum diupdate', [
                'recap_id' => $recap->id,
                'old_status_id' => $recap->presence_status_id,
                'old_status_name' => optional($recap->presenceStatus)->name
            ]);

            // Update status kehadiran
            $recap->presence_status_id = $request->status_id;

            // Update verifikasi jika disediakan
            if ($request->has('is_verified')) {
                $recap->status = $request->is_verified ? 1 : 0;
            }

            // Simpan perubahan
            $recap->save();

            // Refresh model untuk memastikan data terbaru
            $recap->refresh();

            // Memuat data relasi untuk respons
            $recap->load(['presenceStatus', 'presence', 'presence.student', 'presence.classes']);

            // Log status setelah diupdate
            \Log::info('Status setelah diupdate', [
                'recap_id' => $recap->id,
                'new_status_id' => $recap->presence_status_id,
                'new_status_name' => optional($recap->presenceStatus)->name
            ]);

            $responseData = [
                'id' => $recap->id,
                'student_name' => $recap->presence->student->name ?? 'Unknown',
                'status' => $recap->presenceStatus->name ?? 'Unknown',
                'is_verified' => (bool) $recap->status,
            ];

            // Jika request mengharapkan JSON, kembalikan respons JSON
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Status kehadiran berhasil diperbarui',
                    'data' => $responseData
                ]);
            }

            // Otherwise redirect back with success message
            return redirect()->back()->with('flash', [
                'type' => 'success',
                'message' => 'Status kehadiran berhasil diperbarui'
            ]);
        } catch (\Exception $e) {
            // Log error untuk debugging
            \Log::error('Error updating attendance status: ' . $e->getMessage(), [
                'exception' => $e,
                'request_data' => $request->all()
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Terjadi kesalahan saat memperbarui status: ' . $e->getMessage()
                ], 500);
            }

            return redirect()->back()->withErrors([
                'error' => 'Terjadi kesalahan saat memperbarui status: ' . $e->getMessage()
            ]);
        }
    }

    // Mapper status dari nama status ke nilai yang digunakan di frontend
    private function mapStatusToFrontend($statusName)
    {
        switch ($statusName) {
            case 'Hadir':
                return 'present';
            case 'Terlambat':
                return 'late';
            case 'Izin':
            case 'Sakit':
            case 'Alfa':
                return 'absent';
            default:
                return 'unknown';
        }
    }

    // Fungsi untuk menghitung statistik
    private function calculateStatistics($records)
    {
        $total = count($records);
        $present = 0;
        $absent = 0;
        $late = 0;

        foreach ($records as $record) {
            switch ($record['status']) {
                case 'present':
                    $present++;
                    break;
                case 'absent':
                    $absent++;
                    break;
                case 'late':
                    $late++;
                    break;
            }
        }

        return [
            'total' => $total,
            'present' => $present,
            'absent' => $absent,
            'late' => $late,
            'percentages' => [
                'present' => $total > 0 ? round(($present / $total) * 100) : 0,
                'absent' => $total > 0 ? round(($absent / $total) * 100) : 0,
                'late' => $total > 0 ? round(($late / $total) * 100) : 0,
            ]
        ];
    }
}