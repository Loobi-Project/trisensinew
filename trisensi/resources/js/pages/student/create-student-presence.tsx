import AppLayoutStudent from '@/layouts/student/app-layout-student';
import { PageProps, type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard Siswa',
        href: route('student.dashboard'),
    },
    {
        title: 'Create Presence',
        href: route('student.create-presence'),
    },
];

export default function CreateStudentPresence() {
    const { classes, semesters, flash, activeQrCode } = usePage<PageProps>().props;
    const [form, setForm] = useState({
        classes_id: '',
        semester_id: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Check if user has an active QR code and redirect if needed
    useEffect(() => {
        // If already redirecting, don't redirect again
        if (isRedirecting) return;

        // If there is an active QR code and it's not expired
        if (activeQrCode && !activeQrCode.isExpired) {
            setIsRedirecting(true);

            // Redirect to generate-qr with the existing parameters
            const existingData = {
                classes_id: activeQrCode.classes_id,
                semester_id: activeQrCode.semester_id,
            };

            router.get(route('student.generate-qr'), existingData);
        }
    }, [activeQrCode, isRedirecting]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        router.post(route('student.store-presence'), form, {
            onSuccess: () => {
                // Setelah store presence berhasil, langsung generate QR
                router.post(route('student.generate-qr'), form, {
                    onSuccess: () => {
                        // Setelah QR berhasil digenerate, reload halaman sepenuhnya
                        window.location.href = route('student.generate-qr');
                    },
                    onError: (errors) => {
                        setErrors(errors);
                        setLoading(false);
                    },
                });
            },
            onError: (errors) => {
                setErrors(errors);
                setLoading(false);
            },
        });
    };

    // If redirecting, show a loading state
    if (isRedirecting) {
        return (
            <AppLayoutStudent breadcrumbs={breadcrumbs}>
                <Head title="Create Presence - Siswa" />
                <div className="flex">
                    <main className="min-h-screen flex-1 p-5">
                        <div className="border-sidebar-border/70 dark:border-sidebar-border relative mt-4 min-h-[100vh] flex-1 overflow-hidden rounded-xl border bg-gray-900 p-6 text-white md:min-h-min">
                            <h2 className="mb-4 text-2xl font-bold">Mengarahkan ke halaman QR Code...</h2>
                            <div className="flex justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                            </div>
                        </div>
                    </main>
                </div>
            </AppLayoutStudent>
        );
    }

    return (
        <AppLayoutStudent breadcrumbs={breadcrumbs}>
            <Head title="Create Presence - Siswa" />
            <div className="flex">
                <main className="min-h-screen flex-1 p-5">
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative mt-4 min-h-[100vh] flex-1 overflow-hidden rounded-xl border bg-gray-900 p-6 text-white md:min-h-min">
                        <h2 className="mb-4 text-2xl font-bold">Isi data berikut sebelum presensi</h2>

                        {flash && flash.error && <div className="mb-4 rounded-xl border border-red-600 bg-red-800 p-4 text-white">{flash.error}</div>}
                        {flash && flash.success && (
                            <div className="mb-4 rounded-xl border border-green-600 bg-green-800 p-4 text-white">{flash.success}</div>
                        )}

                        {activeQrCode && activeQrCode.isExpired && (
                            <div className="mb-4 rounded-xl border border-yellow-600 bg-yellow-800 p-4 text-white">
                                QR Code Anda telah kedaluwarsa. Silahkan buat QR Code baru.
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                            <div>
                                <label htmlFor="classes_id" className="block text-sm font-medium text-gray-300">
                                    Pilih Kelas
                                </label>
                                <select
                                    id="classes_id"
                                    name="classes_id"
                                    className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 py-2 pr-10 pl-3 text-white focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
                                    value={form.classes_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Pilih berikut</option>
                                    {classes &&
                                        classes.map((classItem: any) => (
                                            <option key={classItem.id} value={classItem.id}>
                                                {classItem.name}
                                            </option>
                                        ))}
                                </select>
                                {errors.classes_id && <p className="mt-2 text-sm text-red-400">{errors.classes_id}</p>}
                            </div>

                            <div>
                                <label htmlFor="semester_id" className="block text-sm font-medium text-gray-300">
                                    Pilih Semester
                                </label>
                                <select
                                    id="semester_id"
                                    name="semester_id"
                                    className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 py-2 pr-10 pl-3 text-white focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
                                    value={form.semester_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Pilih berikut</option>
                                    {semesters &&
                                        semesters.map((semester: any) => (
                                            <option key={semester.id} value={semester.id}>
                                                {semester.batch}
                                            </option>
                                        ))}
                                </select>
                                {errors.semester_id && <p className="mt-2 text-sm text-red-400">{errors.semester_id}</p>}
                            </div>

                            <div className="flex items-center justify-end">
                                <button
                                    type="submit"
                                    className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-xs font-semibold tracking-widest text-white uppercase transition hover:bg-blue-700 focus:border-blue-800 focus:ring focus:ring-blue-200 focus:outline-none active:bg-blue-800 disabled:opacity-25"
                                    disabled={loading}
                                >
                                    {loading ? 'Generating QR Code...' : 'Generate QR Code'}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </AppLayoutStudent>
    );
}
