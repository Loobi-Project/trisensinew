<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Presence;
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
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$presence) {
            return null;
        }

        // Get class and semester info
        $className = DB::table('classes')->where('id', $presence->classes_id)->value('name');
        $semesterBatch = DB::table('semesters')->where('id', $presence->semester_id)->value('batch');

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

    public function index(Request $request): Response
    {
        return Inertia::render('student/dashboard', $this->getSharedData($request));
    }

    public function createPresence(Request $request): Response
    {
        $classes = DB::table('classes')->select('id', 'name')->get();
        $semesters = DB::table('semesters')->select('id', 'batch')->get();

        return Inertia::render('student/create-student-presence', array_merge([
            'classes' => $classes,
            'semesters' => $semesters,
        ], $this->getSharedData($request)));
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
                ->whereDate('created_at', now()->toDateString())
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
            ->orderBy('created_at', 'desc')
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
        $className = DB::table('classes')->where('id', $presence->classes_id)->value('name');
        $semesterBatch = DB::table('semesters')->where('id', $presence->semester_id)->value('batch');

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