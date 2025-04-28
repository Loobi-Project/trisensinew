import AppLayoutStudent from '@/layouts/student/app-layout-student';
import { PageProps, type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Siswa', href: route('student.dashboard') },
    { title: 'QR Code Kehadiran', href: '#' },
];

export default function StudentQrCode() {
    const { qrData, className, semesterBatch, studentName, studentNis, academicYear, expirationDate, daysRemaining } = usePage<PageProps>().props;

    const [qrImageUrl, setQrImageUrl] = useState<string>('');
    const [qrGenerationError, setQrGenerationError] = useState<string | null>(null);

    const formatRemainingDays = (days: number | string) => {
        const daysNum = Math.floor(Number(days));
        if (daysNum < 30) return `${daysNum} hari lagi`;
        const months = Math.floor(daysNum / 30);
        const remaining = Math.floor(daysNum % 30);
        return remaining === 0 ? `${months} bulan lagi` : `${months} bulan, ${remaining} hari lagi`;
    };

    useEffect(() => {
        if (qrData) {
            QRCode.toDataURL(
                qrData,
                {
                    width: 300,
                    margin: 1,
                    errorCorrectionLevel: 'M',
                },
                (err, url) => {
                    if (err) {
                        console.error('Error generating QR:', err);
                        setQrGenerationError('Gagal membuat QR code.');
                    } else {
                        setQrImageUrl(url);
                    }
                },
            );
        }
    }, [qrData]);

    const handlePrintCardOnly = () => window.print();

    const formattedExpirationDate = expirationDate || 'Tidak tersedia';
    const remaining = daysRemaining !== undefined ? Number(daysRemaining) : 0;
    const isExpiringSoon = remaining < 30;

    const statusMessage = remaining !== undefined
        ? isExpiringSoon
            ? `QR Code akan berakhir dalam ${formatRemainingDays(remaining)}`
            : `QR Code masih berlaku (${formatRemainingDays(remaining)})`
        : 'QR Code masih berlaku';

    return (
        <AppLayoutStudent breadcrumbs={breadcrumbs}>
            <Head title="QR Code Kehadiran - Siswa" />

            {/* Print Styling */}
            <style>{`
                @media print {
                    @page { size: A4; margin: 10mm; }
                    body, html { background: white !important; color: black !important; }
                    .print\\:hidden { display: none !important; }
                    .print\\:text-black { color: black !important; }
                    .print\\:bg-white { background: white !important; }
                    .print\\:p-0 { padding: 0 !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    .print\\:max-w-full { max-width: 100% !important; }
                }
            `}</style>

            <div className="flex justify-center bg-white px-4 py-8 text-black dark:bg-gray-900 dark:text-white print:bg-white print:p-0 print:text-black">
                <main className="w-full max-w-xl rounded-xl bg-white p-6 shadow-md dark:bg-gray-800 print:max-w-full print:shadow-none print:p-0">

                    <h2 className="mb-6 text-center text-2xl font-semibold text-gray-800 dark:text-white print:text-black">
                        QR Code Kehadiran
                    </h2>

                    <div className="mb-6 space-y-2 text-sm sm:text-base print:text-black">
                        <p><strong>Nama Siswa:</strong> {studentName}</p>
                        {studentNis && <p><strong>NIS:</strong> {studentNis}</p>}
                        <p><strong>Kelas:</strong> {className}</p>
                        <p><strong>Semester:</strong> {semesterBatch}</p>
                        {academicYear && <p><strong>Tahun Akademik:</strong> {academicYear}</p>}
                        <p><strong>Berlaku hingga:</strong> {formattedExpirationDate}</p>
                        <p className={`font-medium ${isExpiringSoon ? 'text-yellow-500' : 'text-green-600'}`}>{statusMessage}</p>
                    </div>

                    {qrGenerationError && (
                        <div className="mb-4 rounded bg-red-600 p-3 text-center text-white">
                            {qrGenerationError}
                        </div>
                    )}

                    <div className="mb-6 flex justify-center">
                        <div className="overflow-hidden rounded-lg border border-gray-300 bg-white p-4 shadow-sm print:shadow-none">
                            {qrImageUrl ? (
                                <img
                                    src={qrImageUrl}
                                    alt="QR Code Kehadiran"
                                    className="w-[250px] sm:w-[300px] mx-auto"
                                />
                            ) : (
                                <div className="flex h-[250px] w-[250px] items-center justify-center bg-gray-200 text-gray-500 sm:h-[300px] sm:w-[300px]">
                                    Memuat QR Code...
                                </div>
                            )}
                        </div>
                    </div>

                    <p className="mb-6 text-center text-xs text-gray-600 dark:text-gray-400 print:text-black">
                        Tunjukkan QR Code ini kepada petugas untuk melakukan presensi.
                        {formattedExpirationDate !== 'Tidak tersedia' && (
                            <> Berlaku sampai <strong>{formattedExpirationDate}</strong>.</>
                        )}
                    </p>

                    <div className="flex flex-wrap justify-center gap-3 print:hidden">
                        <button
                            onClick={handlePrintCardOnly}
                            className="rounded-md bg-gray-700 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800"
                        >
                            Print QR Code
                        </button>
                        {isExpiringSoon && (
                            <a
                                href={route('student.create-presence')}
                                className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                            >
                                Perbarui QR Code
                            </a>
                        )}
                    </div>
                </main>
            </div>
        </AppLayoutStudent>
    );
}
