import AppLayoutStudent from '@/layouts/student/app-layout-student';
import { PageProps, type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard Siswa',
        href: route('student.dashboard'),
    },
];

export default function Dashboard() {
    const { hadir, izin, sakit, alfa, todayStatus, student, activeSemester } = usePage<PageProps>().props;

    // Ensure student is defined before accessing its properties
    const studentName = student?.name || 'Student Name';  // Fallback to 'Student Name' if student is undefined
    const studentClassroom = student?.classroom?.name || 'No Classroom'; // Fallback if classroom is undefined

    // Ensure activeSemester is defined before accessing its properties
    const activeSemesterName = activeSemester?.name || 'No Active Semester'; // Fallback if activeSemester is undefined

    return (
        <AppLayoutStudent breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - Siswa" />
            <div className="flex">
                <main className="min-h-screen flex-1 p-5">
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative mt-4 min-h-[100vh] flex-1 overflow-hidden rounded-xl border bg-gray-900 p-6 text-white md:min-h-min">
                        <h2 className="mb-4 text-2xl font-bold">Halo, {studentName}</h2>

                        {/* Summary Cards */}
                        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                            <SummaryCard title="Hadir" count={hadir} color="green" />
                            <SummaryCard title="Izin" count={izin} color="blue" />
                            <SummaryCard title="Sakit" count={sakit} color="yellow" />
                            <SummaryCard title="Alfa" count={alfa} color="red" />
                        </div>

                        {/* Today's Status */}
                        <div className="mb-6">
                            <h3 className="mb-1 text-xl font-semibold">Status Hari Ini: {todayStatus?.presence_status?.name || 'Belum Absen'}</h3>
                            {todayStatus && (
                                <p className="text-gray-300">
                                    Waktu Absen: {new Date(todayStatus.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            )}
                        </div>

                        {/* Student Info */}
                        <div>
                            <p className="text-gray-300">Kelas: {studentClassroom}</p>
                            <p className="text-gray-300">Semester: {activeSemesterName}</p>
                        </div>
                    </div>
                </main>
            </div>
        </AppLayoutStudent>
    );
}

// Reusable SummaryCard component
function SummaryCard({ title, count, color }: { title: string; count: number; color: 'green' | 'blue' | 'yellow' | 'red' }) {
    const colorMap: Record<string, string> = {
        green: 'bg-green-600',
        blue: 'bg-blue-600',
        yellow: 'bg-yellow-500',
        red: 'bg-red-600',
    };

    return (
        <div className={`rounded-xl p-4 text-center ${colorMap[color]}`}>
            <p className="text-lg font-bold">{count} Hari</p>
            <p className="text-sm">{title}</p>
        </div>
    );
}
