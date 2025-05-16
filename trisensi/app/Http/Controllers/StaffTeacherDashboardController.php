<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Staff;
use App\Models\Teacher;
use App\Models\Classes;
use App\Models\Presence;
use App\Models\PresenceRecap;
use App\Models\PresenceStatus;
use App\Models\Subject;
use App\Models\SubjectPresenceRecap;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Controller;

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

    // New controller method to handle the presence recap
    public function indexRecaps()
    {
        // Get the authenticated user
        $user = Auth::user();

        // Get the teacher record for this staff
        $teacher = Teacher::whereHas('staff', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->first();

        if (!$teacher) {
            return redirect()->route('staffteacher.dashboard')->with('error', 'Anda tidak terdaftar sebagai guru.');
        }

        // Get classes that have students with presence records
        $classes = Classes::withCount(['presences' => function ($query) {
            $query->where('is_active', true);
        }])->having('presences_count', '>', 0)->get();

        // Get subjects assigned to this teacher
        $subjects = Subject::where('teacher_id', $teacher->id)
            ->where('is_active', true)
            ->get();

        return Inertia::render('staffteacher/presence-recap-entry', [
            'classes' => $classes,
            'subjects' => $subjects
        ]);
    }

    public function getStudentsByClass(Request $request)
    {
        $request->validate([
            'classId' => 'required|exists:classes,id',
            'date' => 'required|date_format:Y-m-d',
        ]);

        $classId = $request->classId;
        $date = $request->date;

        // Get ALL students from the class with their presence records
        $students = Presence::where('classes_id', $classId)
            ->where('is_active', true)
            ->with(['student.user', 'recaps' => function ($query) use ($date) {
                $query->whereDate('timestamp', $date)
                    ->with('presenceStatus'); // Eager load status information
            }])
            ->get()
            ->map(function ($presence) {
                return [
                    'presence_id' => $presence->id,
                    'student_id' => $presence->student_id,
                    'student_name' => $presence->student->user->name,
                    'nis' => $presence->student->nis,
                    'recaps' => $presence->recaps->map(function ($recap) {
                        return [
                            'id' => $recap->id,
                            'presence_status_id' => $recap->presence_status_id,
                            'presence_status_name' => $recap->presenceStatus->name ?? null,
                        ];
                    }),
                ];
            });

        return response()->json([
            'students' => $students
        ]);
    }

    public function storeSubjectPresenceRecaps(Request $request)
    {
        $request->validate([
            'subjectId' => 'required|exists:subjects,id',
            'presenceRecapIds' => 'required|array',
            'presenceRecapIds.*' => 'required|exists:presence_recaps,id',
            'date' => 'required|date_format:Y-m-d',
        ]);

        // Verify that this teacher has access to this subject
        $user = Auth::user();
        $teacher = Teacher::whereHas('staff', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->first();

        $subject = Subject::where('id', $request->subjectId)
            ->where('teacher_id', $teacher->id)
            ->first();

        if (!$subject) {
            return response()->json(['message' => 'Anda tidak memiliki akses ke mata pelajaran ini.'], 403);
        }

        // Check for duplicate entries
        $existingRecaps = SubjectPresenceRecap::whereIn('presence_recap_id', $request->presenceRecapIds)
            ->where('subject_id', $request->subjectId)
            ->whereDate('timestamp', $request->date)
            ->count();

        if ($existingRecaps > 0) {
            return response()->json(['message' => 'Beberapa data presensi sudah ada untuk mata pelajaran ini pada tanggal tersebut.'], 422);
        }

        // Verify that all presence_recap_ids are from the same class
        $presenceRecaps = PresenceRecap::whereIn('id', $request->presenceRecapIds)
            ->with('presence.classes')
            ->get();

        $classIds = $presenceRecaps->pluck('presence.classes_id')->unique();
        if ($classIds->count() > 1) {
            return response()->json(['message' => 'Data presensi harus dari kelas yang sama.'], 422);
        }

        // Create the subject presence recaps
        DB::beginTransaction();
        try {
            $timestamp = now();
            foreach ($request->presenceRecapIds as $recapId) {
                SubjectPresenceRecap::create([
                    'presence_recap_id' => $recapId,
                    'subject_id' => $request->subjectId,
                    'timestamp' => $timestamp,
                ]);
            }
            DB::commit();
            return response()->json(['message' => 'Data presensi mata pelajaran berhasil disimpan.'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Terjadi kesalahan saat menyimpan data presensi: ' . $e->getMessage()], 500);
        }
    }

    public function deleteSubjectPresenceRecaps(Request $request)
    {
        $request->validate([
            'subjectId' => 'required|exists:subjects,id',
            'classId' => 'required|exists:classes,id',
            'date' => 'required|date_format:Y-m-d',
        ]);

        // Verify that this teacher has access to this subject
        $user = Auth::user();
        $teacher = Teacher::whereHas('staff', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->first();

        $subject = Subject::where('id', $request->subjectId)
            ->where('teacher_id', $teacher->id)
            ->first();

        if (!$subject) {
            return response()->json(['message' => 'Anda tidak memiliki akses ke mata pelajaran ini.'], 403);
        }

        // Get presence recap IDs for the class
        $presenceRecapIds = PresenceRecap::join('presence', 'presence_recaps.presence_id', '=', 'presence.id')
            ->where('presence.classes_id', $request->classId)
            ->whereDate('presence_recaps.timestamp', $request->date)
            ->pluck('presence_recaps.id')
            ->toArray();

        // Delete subject presence recaps for these recap IDs
        DB::beginTransaction();
        try {
            $deleted = SubjectPresenceRecap::whereIn('presence_recap_id', $presenceRecapIds)
                ->where('subject_id', $request->subjectId)
                ->whereDate('timestamp', $request->date)
                ->delete();

            DB::commit();

            if ($deleted === 0) {
                return response()->json(['message' => 'Tidak ada data presensi untuk dihapus.'], 404);
            }

            return response()->json(['message' => 'Data presensi mata pelajaran berhasil dihapus.'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Terjadi kesalahan saat menghapus data presensi: ' . $e->getMessage()], 500);
        }
    }

    public function getRecappedStudents(Request $request)
    {
        $request->validate([
            'classId' => 'required|exists:classes,id',
            'date' => 'required|date_format:Y-m-d',
            'subjectId' => 'nullable|exists:subjects,id',
        ]);

        $classId = $request->classId;
        $date = $request->date;
        $subjectId = $request->subjectId;

        // Get all presence recap IDs for the class on the given date
        $presenceRecapQuery = PresenceRecap::join('presence', 'presence_recaps.presence_id', '=', 'presence.id')
            ->where('presence.classes_id', $classId)
            ->whereDate('presence_recaps.timestamp', $date);

        $presenceRecapIds = $presenceRecapQuery->pluck('presence_recaps.id')->toArray();

        // Query builder for subject presence recaps
        $subjectPresenceQuery = SubjectPresenceRecap::whereIn('presence_recap_id', $presenceRecapIds)
            ->whereDate('timestamp', $date)
            ->with([
                'presenceRecap.presence.student.user',
                'presenceRecap.presenceStatus',
                'presenceRecap.presence.classes',
                'subject' // Add subject relation to fetch subject details
            ]);

        // Filter by subject if provided
        if ($subjectId) {
            $subjectPresenceQuery->where('subject_id', $subjectId);

            // If subject ID is provided, check if teacher has access
            $user = Auth::user();
            $teacher = Teacher::whereHas('staff', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })->first();

            if ($teacher) {
                $subject = Subject::where('id', $subjectId)
                    ->where('teacher_id', $teacher->id)
                    ->first();

                if (!$subject) {
                    return response()->json([
                        'message' => 'Anda tidak memiliki akses ke mata pelajaran ini.'
                    ], 403);
                }
            }
        }

        $subjectPresenceRecaps = $subjectPresenceQuery->get();

        // Map the data to the format expected by the frontend with additional class information
        $recappedStudents = $subjectPresenceRecaps->map(function ($subjectPresenceRecap) {
            $presenceRecap = $subjectPresenceRecap->presenceRecap;
            $student = $presenceRecap->presence->student;
            $class = $presenceRecap->presence->classes;
            $subject = $subjectPresenceRecap->subject; // Get subject from relationship

            return [
                'student_id' => $student->id,
                'student_name' => $student->user->name,
                'nis' => $student->nis,
                'presence_status_name' => $presenceRecap->presenceStatus->name ?? 'tidak diketahui',
                'class_id' => $class->id,
                'class_name' => $class->name,
                'subject_id' => $subject->id, // Include subject ID
                'subject_name' => $subject->name, // Include subject name
            ];
        });

        return response()->json([
            'recappedStudents' => $recappedStudents
        ]);
    }
}