<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Models\Presence;
use App\Models\Semester;
use App\Models\Student;
use App\Models\AbsenceLetterTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

class StudentDashboardController extends Controller
{
    /**
     * Get active QR code information for a student
     * 
     * @param int $studentId
     * @return array|null
     */
    private function getActiveQrCodeInfo($studentId)
    {
        $presence = Presence::where('student_id', $studentId)
            ->where('is_active', true)
            ->where('expiration_date', '>', now())
            ->orderBy('timestamp', 'desc')
            ->first();

        if (!$presence) {
            return null;
        }

        // Use proper model relationships
        $className = $presence->classes->name ?? null;
        $semesterBatch = $presence->semester->batch ?? null;

        // Create a Carbon instance if it's a string
        $expirationDate = $presence->expiration_date;
        if (is_string($expirationDate)) {
            $expirationDate = \Carbon\Carbon::parse($expirationDate);
        }

        return [
            'id' => $presence->id,
            'classes_id' => $presence->classes_id,
            'semester_id' => $presence->semester_id,
            'className' => $className,
            'semesterBatch' => $semesterBatch,
            'expirationDate' => $expirationDate->format('d-m-Y'),
            'daysRemaining' => now()->diffInDays($expirationDate),
            'isExpired' => now()->greaterThan($expirationDate)
        ];
    }

    /**
     * Share common data with all views
     * 
     * @param Request $request
     * @return array
     */
    private function getSharedData(Request $request)
    {
        $student = $request->user()->student;
        return [
            'activeQrCode' => $this->getActiveQrCodeInfo($student->id)
        ];
    }

    public function index()
    {
        $user = Auth::user();
        $student = $user->student;

        $presenceRecaps = DB::table('presence_recaps')
            ->join('presence_status', 'presence_recaps.presence_status_id', '=', 'presence_status.id')
            ->select('presence_status.name', DB::raw('count(*) as count'))
            ->groupBy('presence_status.name')
            ->get();

        // Mengambil status kehadiran berdasarkan nama status
        $hadir = $presenceRecaps->where('name', 'Hadir')->first()->count ?? 0;
        $terlambat = $presenceRecaps->where('name', 'Terlambat')->first()->count ?? 0;
        $izin = $presenceRecaps->where('name', 'Izin')->first()->count ?? 0;
        $sakit = $presenceRecaps->where('name', 'Sakit')->first()->count ?? 0;
        $alfa = $presenceRecaps->where('name', 'Alfa')->first()->count ?? 0;

        $todayPresence = $student->presences()->whereDate('created_at', today())->first();

        return inertia('Student/Dashboard', [
            'auth' => [
                'user' => $user,
            ],
            'totalPresenceRecaps' => $presenceRecaps->count(),
            'hadir' => $hadir,
            'terlambat' => $terlambat,
            'izin' => $izin,
            'sakit' => $sakit,
            'alfa' => $alfa,
            'todayStatus' => $todayPresence ? [
                'presenceStatus' => $todayPresence->presenceStatus,
                'timestamp' => $todayPresence->created_at,
            ] : null,
            'student' => $student,
            'classroom' => $student->classroom->name ?? null,
            'activeSemester' => $student->classroom->activeSemester ?? null,
            'semesterName' => optional($student->classroom->activeSemester)->name,
            'presence' => $todayPresence,  // Tambahkan data presence ke dalam props
            'debug' => app()->environment('local') ? $presenceRecaps : null,
        ]);
    }

    public function getDetectIsActiveStudent()
    {
        try {
            $user = auth()->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak ditemukan'
                ], 401);
            }

            // Ambil data student berdasarkan user_id
            $student = Student::where('user_id', $user->id)->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data student tidak ditemukan'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'is_active' => $student->is_active,
                'student_data' => [
                    'id' => $student->id,
                    'nis' => $student->nis,
                    'name' => $user->name,
                    'email' => $user->email
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function createPresence(Request $request): Response
    {
        // Use Eloquent instead of raw DB queries
        $classes = \App\Models\Classes::select('id', 'name')->get();
        $semesters = Semester::select('id', 'batch')->get();

        return Inertia::render('student/create-student-presence', array_merge([
            'classes' => $classes,
            'semesters' => $semesters,
        ], $this->getSharedData($request)));
    }

    // Letter template absence page
    public function selectAbsenceLetterTemplate()
    {
        $templates = AbsenceLetterTemplate::all();

        return Inertia::render('student/student-absence-letter', [
            'templates' => $templates,
        ]);
    }

    /**
     * Store presence data
     */
    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            // Validasi input dari form
            $validated = $request->validate([
                'classes_id' => 'required|exists:classes,id',
                'semester_id' => 'required|exists:semesters,id',
            ]);

            // Ambil student
            $student = $request->user()->student;

            // Cek apakah sudah ada presensi untuk hari ini
            $existingPresence = Presence::where([
                'classes_id' => $validated['classes_id'],
                'semester_id' => $validated['semester_id'],
                'student_id' => $student->id,
            ])
                ->whereDate('timestamp', now()->toDateString())
                ->first();

            // Jika sudah ada, gunakan yang ada
            if ($existingPresence) {
                $presence = $existingPresence;
            } else {
                // Jika belum ada, buat baru
                $presence = Presence::create([
                    'classes_id' => $validated['classes_id'],
                    'semester_id' => $validated['semester_id'],
                    'student_id' => $student->id,
                    'timestamp' => now(),
                    'is_active' => true,
                ]);
            }

            DB::commit();

            // Store presence data in session for the next step
            session()->flash('presence_data', [
                'id' => $presence->id,
                'classes_id' => $validated['classes_id'],
                'semester_id' => $validated['semester_id'],
                'student_id' => $student->id,
            ]);

            // Return to the same page with success message for Inertia
            return back()->with('success', 'Data presensi berhasil disimpan');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal menyimpan data: ' . $e->getMessage());
        }
    }

    /**
     * Generate QR Code based on selected class and semester
     */
    // Untuk POST - Membuat QR baru dan update timestamp
    public function generateQr(Request $request): Response
    {
        // Validasi input
        $validated = $request->validate([
            'classes_id' => 'required|exists:classes,id',
            'semester_id' => 'required|exists:semesters,id',
        ]);

        $student = $request->user()->student;
        $expirationDate = now()->addMonths(6);

        // Update or Create Presence
        $presence = Presence::updateOrCreate(
            [
                'classes_id' => $validated['classes_id'],
                'semester_id' => $validated['semester_id'],
                'student_id' => $student->id,
            ],
            [
                'timestamp' => now(),
                'is_active' => true,
                'expiration_date' => $expirationDate,
            ]
        );

        return $this->renderQrPage($student, $presence);
    }

    // Untuk GET - Menampilkan QR tanpa mengubah timestamp
    public function showQr(Request $request): Response
    {
        $student = $request->user()->student;

        // Cari presence aktif yang belum expired
        $presence = Presence::where('student_id', $student->id)
            ->where('is_active', true)
            ->where('expiration_date', '>', now())
            ->orderBy('timestamp', 'desc')
            ->first();

        if (!$presence) {
            abort(404, 'QR Code tidak ditemukan atau sudah expired.');
        }

        return $this->renderQrPage($student, $presence);
    }

    // Kode untuk render QR Page
    private function renderQrPage($student, $presence)
    {
        $qrData = json_encode([
            'presence_id' => $presence->id
        ]);

        $renderer = new ImageRenderer(
            new RendererStyle(256),
            new SvgImageBackEnd()
        );
        $writer = new Writer($renderer);
        $qrCode = $writer->writeString($qrData);

        $studentName = $student->user->name;
        $nis = $student->nis;
        $academicYear = $student->academicYear ? $student->academicYear->description : 'N/A';

        // Use model relationships instead of DB queries
        $className = $presence->classes->name ?? 'N/A';
        $semesterBatch = $presence->semester->batch ?? 'N/A';

        $expirationDate = $presence->expiration_date;
        if (is_string($expirationDate)) {
            $expirationDate = \Carbon\Carbon::parse($expirationDate);
        }
        $daysRemaining = now()->diffInDays($expirationDate);

        return Inertia::render('student/student-qr-code', array_merge([
            'qrData' => $qrData,
            'className' => $className,
            'semesterBatch' => $semesterBatch,
            'studentName' => $studentName,
            'studentNis' => $nis,
            'academicYear' => $academicYear,
            'expirationDate' => $expirationDate->format('d-m-Y'),
            'daysRemaining' => $daysRemaining,
            'presenceData' => [
                'presence_id' => $presence->id,
                'classes_id' => $presence->classes_id,
                'semester_id' => $presence->semester_id,
                'student_id' => $student->id,
            ]
        ], $this->getSharedData(request())));
    }
}