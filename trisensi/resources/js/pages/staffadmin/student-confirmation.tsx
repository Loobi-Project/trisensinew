import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import AppLayoutStaffAdmin from '@/layouts/staffadmin/app-layout-staffadmin';
import { type BreadcrumbItem } from '@/types';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';

interface Student {
    id: number;
    name: string;
    email: string;
    nis: string;
    academic_year: string;
    role: string;
    is_active: boolean;
    last_login: string | null;
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
}

interface ConfirmStudentProps {
    students: Student[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard Tata Usaha',
        href: '/tatausaha/dashboard',
    },
    {
        title: 'Konfirmasi Siswa',
        href: '/tatausaha/student-confirmation',
    },
];

export default function ConfirmStudent({ students = [] }: ConfirmStudentProps) {
    const { post } = useForm();
    const [users, setUsers] = useState<Student[]>([]);
    const [sortedUsers, setSortedUsers] = useState<Student[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
    const [processingIds, setProcessingIds] = useState<{ [key: string]: boolean }>({});
    const [processedStudents, setProcessedStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState('');

    // Memproses data siswa untuk normalisasi struktur data
    useEffect(() => {
        if (!users || users.length === 0) {
            setProcessedStudents([]);
            return;
        }

        // Data dari API sudah dalam format yang benar, tidak perlu normalisasi kompleks
        const normalized = users.map((student) => {
            return {
                ...student,
                is_active_true: student.is_active === true || student.is_active === 1,
                is_active_false: student.is_active === false || student.is_active === 0,
            };
        });
        setProcessedStudents(normalized);
    }, [users]);

    useEffect(() => {
        const controller = new AbortController();
        fetchStudentUsers(controller.signal);
        return () => controller.abort();
    }, [retryCount]);

    useEffect(() => {
        setSortedUsers([...users]);
    }, [users]);

    // Fallback to use provided students if API fails
    useEffect(() => {
        if (error && students && students.length > 0) {
            // Convert students prop to match the new interface structure
            const convertedStudents = students.map((student) => ({
                id: student.id,
                name: student.user?.name || student.name || 'Nama tidak tersedia',
                email: student.user?.email || 'Email tidak tersedia',
                nis: student.nis || 'Tidak ada NIS',
                academic_year: 'Tidak ada tahun akademik',
                role: 'student',
                is_active: student.is_active === true || student.is_active === 1,
                last_login: null,
                user: student.user || null,
            }));

            setUsers(convertedStudents);
        }
    }, [error, students]);

    const fetchStudentUsers = async (signal?: AbortSignal) => {
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(route('staffadmin.get-student'), { signal });

            // Controller mengembalikan array langsung dalam response.data
            if (response.data && Array.isArray(response.data)) {
                // Tidak perlu filter berdasarkan is_active di sini karena kita butuh semua data
                // untuk menampilkan siswa yang confirmed dan unconfirmed
                setUsers(response.data);
                setError(null);
            } else {
                console.error('Unexpected response format:', response.data);
                throw new Error('Format data tidak sesuai - data bukan array');
            }
        } catch (error) {
            console.error('Gagal memuat data siswa:', error);

            // Handle different types of errors
            if (axios.isAxiosError(error)) {
                if (error.code === 'ERR_CANCELED') {
                    // Request was aborted, don't show error
                    return;
                }

                if (error.response) {
                    // Server responded with error status
                    const status = error.response.status;
                    const statusText = error.response.statusText;
                    const errorMsg = `Gagal memuat data siswa: ${status} ${statusText}`;

                    setError(errorMsg);
                    showAlert('error', errorMsg);

                    // Handle specific error codes
                    switch (status) {
                        case 401:
                            showAlert('warning', 'Sesi Anda telah berakhir. Silakan login kembali.', 5000);
                            break;
                        case 403:
                            showAlert('warning', 'Anda tidak memiliki akses untuk melihat data siswa.', 5000);
                            break;
                        case 404:
                            showAlert('warning', 'Endpoint tidak ditemukan. Hubungi administrator.', 5000);
                            break;
                        case 500:
                            showAlert('info', 'Terjadi kesalahan server. Hubungi administrator sistem.', 5000);
                            break;
                    }
                } else if (error.request) {
                    // Request was made but no response received
                    const errorMsg = 'Tidak ada respons dari server';
                    setError(errorMsg);
                    showAlert('error', 'Tidak ada respons dari server. Periksa koneksi internet Anda.');
                } else {
                    // Error in request setup
                    const errorMsg = `Terjadi kesalahan dalam setup request: ${error.message}`;
                    setError(errorMsg);
                    showAlert('error', errorMsg);
                }
            } else if (error instanceof Error) {
                setError(error.message);
                showAlert('error', `Terjadi kesalahan: ${error.message}`);
            } else {
                setError('Unknown error');
                showAlert('error', 'Gagal memuat data siswa. Silakan coba lagi.');
            }

            // Use fallback data if available
            if (students && students.length > 0) {
                // Convert students prop to match the new interface structure
                const convertedStudents = students.map((student) => ({
                    id: student.id,
                    name: student.user?.name || student.name || 'Nama tidak tersedia',
                    email: student.user?.email || 'Email tidak tersedia',
                    nis: student.nis || 'Tidak ada NIS',
                    academic_year: 'Tidak ada tahun akademik',
                    role: 'student',
                    is_active: student.is_active === true || student.is_active === 1,
                    last_login: null,
                    user: student.user || null,
                }));

                setUsers(convertedStudents);
                showAlert('warning', 'Menggunakan data cache. Beberapa data mungkin tidak terbaru.', 5000);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = (id: number) => {
        setSelectedUsers((prevSelected) => {
            const newSet = new Set(prevSelected);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const confirmStudent: FormEventHandler<HTMLButtonElement> = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (!id) return;

        if (confirm('Apakah Anda yakin ingin mengonfirmasi siswa ini?')) {
            setProcessingIds((prev) => ({ ...prev, [id]: true }));

            // Menggunakan route helper dengan parameter student
            const url = route('confirm.student.update', { student: id });

            post(url, {
                onSuccess: () => {
                    // Show success message
                    showAlert('success', 'Siswa berhasil dikonfirmasi!');
                    // Refresh the data
                    setRetryCount((prev) => prev + 1);
                },
                onError: (errors) => {
                    // Show error message with details if available
                    const errorMessage = Object.values(errors).flat().join(', ');
                    showAlert('error', errorMessage || 'Gagal mengonfirmasi siswa.');
                },
                onFinish: () => {
                    setProcessingIds((prev) => ({ ...prev, [id]: false }));
                },
            });
        }
    };

    const showAlert = (type: 'success' | 'error' | 'warning' | 'info', message: string, duration = 3000) => {
        const alertId = `alert-${Date.now()}`;

        // Deteksi tema yang digunakan
        const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Tentukan warna berdasarkan tipe dan tema (warna solid, tidak transparan)
        let backgroundColor, textColor, borderColor;

        if (isDarkMode) {
            // Warna solid untuk dark mode
            switch (type) {
                case 'success':
                    backgroundColor = '#0f3a22'; // Hijau gelap solid
                    textColor = '#4ade80';
                    borderColor = '#22c55e';
                    break;
                case 'error':
                    backgroundColor = '#450a0a'; // Merah gelap solid
                    textColor = '#f87171';
                    borderColor = '#ef4444';
                    break;
                case 'warning':
                    backgroundColor = '#422006'; // Kuning gelap solid
                    textColor = '#fcd34d';
                    borderColor = '#eab308';
                    break;
                case 'info':
                    backgroundColor = '#172554'; // Biru gelap solid
                    textColor = '#93c5fd';
                    borderColor = '#3b82f6';
                    break;
            }
        } else {
            // Warna solid untuk light mode
            switch (type) {
                case 'success':
                    backgroundColor = '#dcfce7'; // Hijau terang solid
                    textColor = '#166534';
                    borderColor = '#22c55e';
                    break;
                case 'error':
                    backgroundColor = '#fee2e2'; // Merah terang solid
                    textColor = '#991b1b';
                    borderColor = '#ef4444';
                    break;
                case 'warning':
                    backgroundColor = '#fef9c3'; // Kuning terang solid
                    textColor = '#854d0e';
                    borderColor = '#eab308';
                    break;
                case 'info':
                    backgroundColor = '#dbeafe'; // Biru terang solid
                    textColor = '#1e40af';
                    borderColor = '#3b82f6';
                    break;
            }
        }

        // Buat style inline untuk alert
        const style = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 50;
            padding: 12px 16px;
            border-radius: 6px;
            background-color: ${backgroundColor};
            color: ${textColor};
            border-left: 4px solid ${borderColor};
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
            transform: translateX(100%);
            transition: transform 0.3s ease-in-out;
        `;

        // Masukkan HTML alert ke dalam dokumen
        document.body.insertAdjacentHTML(
            'beforeend',
            `<div id="${alertId}" role="alert" class="alert alert-${type}" style="${style}">
                <span>${message}</span>
            </div>`,
        );

        // Animasi masuk
        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                alertElement.style.transform = 'translateX(0)';
            }
        }, 10);

        // Animasi keluar dan hapus elemen
        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                alertElement.style.transform = 'translateX(100%)';
                alertElement.style.transition = 'transform 0.3s ease-in-out';

                // Hapus elemen setelah animasi selesai
                setTimeout(() => {
                    alertElement.remove();
                }, 300);
            }
        }, duration);
    };

    // Filter berdasarkan status aktif (setelah normalisasi)
    const activeStudents = processedStudents.filter((t) => t.is_active_true);
    const inactiveStudents = processedStudents.filter((t) => t.is_active_false);

    return (
        <AppLayoutStaffAdmin breadcrumbs={breadcrumbs}>
            <Head title="Konfirmasi Siswa" />

            <div className="min-h-screen bg-gray-50 pb-12 dark:bg-gray-900">
                {/* Dashboard Header */}
                <div className="bg-white shadow-sm dark:bg-gray-800">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        <div className="flex flex-col items-start justify-between md:flex-row md:items-center">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Konfirmasi Siswa</h1>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Kelola dan pantau proses konfirmasi siswa dalam sistem
                                </p>
                            </div>
                            <div className="mt-4 flex items-center space-x-3 md:mt-0">
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    <span className="mr-1 h-2 w-2 rounded-full bg-blue-500"></span>
                                    Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    {/* Metrics Cards */}
                    <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Total Siswa */}
                        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 rounded-md bg-blue-500 p-3">
                                        <svg
                                            className="h-6 w-6 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                            />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Total Siswa</dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                                    {sortedUsers.filter((student) => student.student).length}
                                                </div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Menunggu Konfirmasi */}
                        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 rounded-md bg-yellow-500 p-3">
                                        <svg
                                            className="h-6 w-6 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Menunggu Konfirmasi</dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-gray-900 dark:text-white">{inactiveStudents.length}</div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Terkonfirmasi */}
                        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 rounded-md bg-green-500 p-3">
                                        <svg
                                            className="h-6 w-6 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Terkonfirmasi</dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                                    {sortedUsers.filter((student) => student.student).length + activeStudents.length}
                                                </div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Confirmation Section */}
                    <div className="mb-8">
                        <div className="overflow-hidden bg-white shadow sm:rounded-md dark:bg-gray-800">
                            <div className="border-b border-gray-200 px-4 py-5 sm:px-6 dark:border-gray-700">
                                <div className="flex flex-wrap items-center justify-between">
                                    <h3 className="flex items-center text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                        <span className="mr-2 h-5 w-5 flex-shrink-0 text-yellow-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path
                                                    fillRule="evenodd"
                                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </span>
                                        Siswa yang Perlu Dikonfirmasi
                                    </h3>
                                    <span className="mt-2 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 sm:mt-0 dark:bg-yellow-900 dark:text-yellow-200">
                                        {inactiveStudents.length} menunggu
                                    </span>
                                </div>
                            </div>

                            {inactiveStudents.length > 0 ? (
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {inactiveStudents.map((student) => (
                                        <li key={student.id}>
                                            <div className="px-4 py-4 hover:bg-gray-50 sm:px-6 dark:hover:bg-gray-700">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600">
                                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                                                    {student.name.substring(0, 2).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{student.name}</div>
                                                            <div className="mt-1 flex items-center">
                                                                <div className="mr-2 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                                                    NIS: {student.nis || 'Tidak Ada'}
                                                                </div>
                                                                {student.class && (
                                                                    <div className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-500 dark:bg-blue-900 dark:text-blue-400">
                                                                        Kelas: {student.class.name}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Button
                                                            data-id={student.id}
                                                            onClick={confirmStudent}
                                                            disabled={processingIds[student.id]}
                                                            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm leading-4 font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:bg-gray-400"
                                                        >
                                                            {processingIds[student.id] ? (
                                                                <>
                                                                    <svg
                                                                        className="mr-2 -ml-1 h-4 w-4 animate-spin text-white"
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <circle
                                                                            className="opacity-25"
                                                                            cx="12"
                                                                            cy="12"
                                                                            r="10"
                                                                            stroke="currentColor"
                                                                            strokeWidth="4"
                                                                        ></circle>
                                                                        <path
                                                                            className="opacity-75"
                                                                            fill="currentColor"
                                                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                                        ></path>
                                                                    </svg>
                                                                    Memproses
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg
                                                                        className="mr-1.5 h-4 w-4"
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        stroke="currentColor"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M5 13l4 4L19 7"
                                                                        />
                                                                    </svg>
                                                                    Konfirmasi
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="bg-gray-50 px-4 py-12 text-center sm:px-6 dark:bg-gray-900">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1}
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                        Tidak ada siswa yang perlu dikonfirmasi
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Semua siswa telah terkonfirmasi dalam sistem.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Confirmed Students Section */}
                    <div>
                        <div className="bg-white shadow sm:rounded-md dark:bg-gray-800">
                            <div className="border-b border-gray-200 px-4 py-5 sm:px-6 dark:border-gray-700">
                                <div className="flex flex-wrap items-center justify-between">
                                    <h3 className="flex items-center text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                        <span className="mr-2 h-5 w-5 flex-shrink-0 text-green-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </span>
                                        Siswa Terkonfirmasi
                                    </h3>
                                    <span className="mt-2 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 sm:mt-0 dark:bg-green-900 dark:text-green-200">
                                        {activeStudents.length} terkonfirmasi
                                    </span>
                                </div>
                                {/* Search Bar */}
                                <div className="mt-4">
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <svg
                                                className="h-5 w-5 text-gray-400"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                                />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                                            placeholder="Cari siswa berdasarkan nama atau NIS"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Filter and display confirmed students */}
                            {(() => {
                                const safeStringIncludes = (str, searchTerm) => {
                                    return str && typeof str === 'string' && str.toLowerCase().includes(searchTerm);
                                };

                                const filteredConfirmedStudents = activeStudents.filter((student) => {
                                    const searchLower = searchTerm.toLowerCase();
                                    return (
                                        safeStringIncludes(student.user?.name, searchLower) ||
                                        safeStringIncludes(student.nis, searchLower) ||
                                        safeStringIncludes(student.user?.email, searchLower) ||
                                        safeStringIncludes(student.academic_year, searchLower)
                                    );
                                });

                                // Group students by academic year
                                const groupedByYear = filteredConfirmedStudents.reduce((acc, student) => {
                                    const year = student.academic_year || 'Tidak Diketahui';
                                    if (!acc[year]) {
                                        acc[year] = [];
                                    }
                                    acc[year].push(student);
                                    return acc;
                                }, {});

                                const academicYears = Object.keys(groupedByYear).sort();
                                const CARDS_PER_PAGE = 9;
                                const STUDENTS_PER_CARD_PAGE = 20;

                                // Card pagination state (you need to add these states to your component)
                                const [currentCardPage, setCurrentCardPage] = useState(1);
                                const [studentPages, setStudentPages] = useState({});

                                const totalCards = academicYears.length;
                                const totalCardPages = Math.ceil(totalCards / CARDS_PER_PAGE);

                                const startCardIndex = (currentCardPage - 1) * CARDS_PER_PAGE;
                                const endCardIndex = startCardIndex + CARDS_PER_PAGE;
                                const currentCards = academicYears.slice(startCardIndex, endCardIndex);

                                const getCurrentStudentPage = (academicYear) => {
                                    return studentPages[academicYear] || 1;
                                };

                                const setCurrentStudentPage = (academicYear, page) => {
                                    setStudentPages((prev) => ({
                                        ...prev,
                                        [academicYear]: page,
                                    }));
                                };

                                const getStudentsForCard = (academicYear) => {
                                    const students = groupedByYear[academicYear] || [];
                                    const currentPage = getCurrentStudentPage(academicYear);
                                    const startIndex = (currentPage - 1) * STUDENTS_PER_CARD_PAGE;
                                    const endIndex = startIndex + STUDENTS_PER_CARD_PAGE;
                                    return students.slice(startIndex, endIndex);
                                };

                                const getTotalStudentPages = (academicYear) => {
                                    const students = groupedByYear[academicYear] || [];
                                    return Math.ceil(students.length / STUDENTS_PER_CARD_PAGE);
                                };

                                if (totalCards === 0) {
                                    return searchTerm ? (
                                        <div className="bg-gray-50 px-4 py-12 text-center sm:px-6 dark:bg-gray-900">
                                            <svg
                                                className="mx-auto h-12 w-12 text-gray-400"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1}
                                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                                />
                                            </svg>
                                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                Tidak ditemukan hasil pencarian
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                Coba gunakan kata kunci yang berbeda atau periksa ejaan.
                                            </p>
                                            <button
                                                onClick={() => setSearchTerm('')}
                                                className="mt-4 inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                                            >
                                                Hapus Filter
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 px-4 py-12 text-center sm:px-6 dark:bg-gray-900">
                                            <svg
                                                className="mx-auto h-12 w-12 text-gray-400"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1}
                                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                />
                                            </svg>
                                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                Belum ada siswa terkonfirmasi
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                Siswa yang sudah dikonfirmasi akan muncul di sini.
                                            </p>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="space-y-6">
                                        {/* Cards Grid */}
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                            <AnimatePresence>
                                                {currentCards.map((academicYear) => {
                                                    const allStudents = groupedByYear[academicYear];
                                                    const displayStudents = getStudentsForCard(academicYear);
                                                    const currentPage = getCurrentStudentPage(academicYear);
                                                    const totalPages = getTotalStudentPages(academicYear);

                                                    return (
                                                        <motion.div
                                                            key={academicYear}
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -20 }}
                                                            className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
                                                        >
                                                            {/* Card Header */}
                                                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center space-x-2">
                                                                        <div className="rounded-full bg-white/20 p-1.5">
                                                                            <svg
                                                                                className="h-4 w-4 text-white"
                                                                                fill="none"
                                                                                viewBox="0 0 24 24"
                                                                                stroke="currentColor"
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    strokeWidth={2}
                                                                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                                                />
                                                                            </svg>
                                                                        </div>
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold text-white">{academicYear}</h3>
                                                                            <p className="text-xs text-blue-100">{allStudents.length} siswa</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="rounded-full bg-white/20 px-2 py-1">
                                                                        <span className="text-xs font-medium text-white">
                                                                            {displayStudents.length}/{allStudents.length}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Students List */}
                                                            <div className="max-h-96 overflow-y-auto p-4">
                                                                <div className="space-y-3">
                                                                    <AnimatePresence>
                                                                        {displayStudents.map((student, index) => (
                                                                            <motion.div
                                                                                key={student.id}
                                                                                initial={{ opacity: 0, x: -20 }}
                                                                                animate={{ opacity: 1, x: 0 }}
                                                                                exit={{ opacity: 0, x: 20 }}
                                                                                transition={{ duration: 0.3, delay: index * 0.02 }}
                                                                                className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
                                                                            >
                                                                                <div className="flex items-center space-x-3">
                                                                                    <div className="flex-shrink-0">
                                                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                                                                                            <span className="text-xs font-medium text-green-800 dark:text-green-200">
                                                                                                {student.user?.name.substring(0, 2).toUpperCase() ||
                                                                                                    '??'}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="min-w-0 flex-1">
                                                                                        <div className="truncate text-xs font-medium text-gray-900 dark:text-white">
                                                                                            {student.name ||
                                                                                                student.user?.name ||
                                                                                                'Nama tidak tersedia'}
                                                                                        </div>
                                                                                        <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                                                                                            {student.user?.email || 'Email tidak tersedia'}
                                                                                        </div>
                                                                                        <div className="mt-1">
                                                                                            <span className="inline-block rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                                                                                                NIS: {student.nis || 'N/A'}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex-shrink-0">
                                                                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                                                                                        <svg
                                                                                            className="mr-1 h-2.5 w-2.5"
                                                                                            fill="none"
                                                                                            viewBox="0 0 24 24"
                                                                                            stroke="currentColor"
                                                                                        >
                                                                                            <path
                                                                                                strokeLinecap="round"
                                                                                                strokeLinejoin="round"
                                                                                                strokeWidth={2}
                                                                                                d="M5 13l4 4L19 7"
                                                                                            />
                                                                                        </svg>
                                                                                        Aktif
                                                                                    </span>
                                                                                </div>
                                                                            </motion.div>
                                                                        ))}
                                                                    </AnimatePresence>
                                                                </div>
                                                            </div>

                                                            {/* Student Pagination for this card */}
                                                            {totalPages > 1 && (
                                                                <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-600 dark:bg-gray-700">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                            Halaman {currentPage} dari {totalPages}
                                                                        </div>
                                                                        <div className="flex space-x-1">
                                                                            <button
                                                                                onClick={() =>
                                                                                    setCurrentStudentPage(academicYear, Math.max(1, currentPage - 1))
                                                                                }
                                                                                disabled={currentPage === 1}
                                                                                className="rounded p-1 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                                            >
                                                                                <svg
                                                                                    className="h-4 w-4"
                                                                                    fill="none"
                                                                                    viewBox="0 0 24 24"
                                                                                    stroke="currentColor"
                                                                                >
                                                                                    <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        strokeWidth={2}
                                                                                        d="M15 19l-7-7 7-7"
                                                                                    />
                                                                                </svg>
                                                                            </button>
                                                                            <button
                                                                                onClick={() =>
                                                                                    setCurrentStudentPage(
                                                                                        academicYear,
                                                                                        Math.min(totalPages, currentPage + 1),
                                                                                    )
                                                                                }
                                                                                disabled={currentPage === totalPages}
                                                                                className="rounded p-1 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                                            >
                                                                                <svg
                                                                                    className="h-4 w-4"
                                                                                    fill="none"
                                                                                    viewBox="0 0 24 24"
                                                                                    stroke="currentColor"
                                                                                >
                                                                                    <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        strokeWidth={2}
                                                                                        d="M9 5l7 7-7 7"
                                                                                    />
                                                                                </svg>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    );
                                                })}
                                            </AnimatePresence>
                                        </div>

                                        {/* Card Pagination */}
                                        {totalCardPages > 1 && (
                                            <div className="flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-700">
                                                <div className="flex flex-1 justify-between sm:hidden">
                                                    <button
                                                        onClick={() => setCurrentCardPage(Math.max(1, currentCardPage - 1))}
                                                        disabled={currentCardPage === 1}
                                                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                                    >
                                                        Sebelumnya
                                                    </button>
                                                    <button
                                                        onClick={() => setCurrentCardPage(Math.min(totalCardPages, currentCardPage + 1))}
                                                        disabled={currentCardPage === totalCardPages}
                                                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                                    >
                                                        Selanjutnya
                                                    </button>
                                                </div>
                                                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                                    <div>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                                            Menampilkan <span className="font-medium">{startCardIndex + 1}</span> sampai{' '}
                                                            <span className="font-medium">{Math.min(endCardIndex, totalCards)}</span> dari{' '}
                                                            <span className="font-medium">{totalCards}</span> tahun ajaran
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                                            <button
                                                                onClick={() => setCurrentCardPage(Math.max(1, currentCardPage - 1))}
                                                                disabled={currentCardPage === 1}
                                                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:ring-gray-600 dark:hover:bg-gray-700"
                                                            >
                                                                <span className="sr-only">Previous</span>
                                                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            </button>

                                                            {Array.from({ length: totalCardPages }, (_, i) => i + 1).map((page) => (
                                                                <button
                                                                    key={page}
                                                                    onClick={() => setCurrentCardPage(page)}
                                                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                                                        page === currentCardPage
                                                                            ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                                                            : 'text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-700'
                                                                    }`}
                                                                >
                                                                    {page}
                                                                </button>
                                                            ))}

                                                            <button
                                                                onClick={() => setCurrentCardPage(Math.min(totalCardPages, currentCardPage + 1))}
                                                                disabled={currentCardPage === totalCardPages}
                                                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:ring-gray-600 dark:hover:bg-gray-700"
                                                            >
                                                                <span className="sr-only">Next</span>
                                                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        </nav>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Loading Overlay */}
                    {loading && (
                        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
                            <div className="rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                                <div className="flex items-center">
                                    <svg
                                        className="mr-3 h-5 w-5 animate-spin text-blue-600"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">Memuat data siswa...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error State with Retry */}
                    {error && !loading && (
                        <div className="fixed right-4 bottom-4 z-50 max-w-sm rounded-lg bg-red-50 p-4 shadow-lg dark:bg-red-900">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg
                                        className="h-5 w-5 text-red-400"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Gagal memuat data</h3>
                                    <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
                                    <div className="mt-3">
                                        <button
                                            onClick={() => setRetryCount((prev) => prev + 1)}
                                            className="rounded-md bg-red-100 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-200 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700"
                                        >
                                            Coba Lagi
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayoutStaffAdmin>
    );
}
