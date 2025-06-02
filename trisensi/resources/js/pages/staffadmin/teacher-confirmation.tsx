import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import AppLayoutStaffAdmin from '@/layouts/staffadmin/app-layout-staffadmin';
import { type BreadcrumbItem } from '@/types';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';

interface Staff {
    id: number;
    nip: string;
    nuptk: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
    role: {
        name: string;
    };
    teacher: {
        name: string;
        is_active: boolean;
    };
}

interface ConfirmTeacherProps {
    teachers: Staff[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard Staff Admin',
        href: '/staffadmin/dashboard',
    },
    {
        title: 'Konfirmasi Guru',
        href: '/staffadmin/teacher-confirmation',
    },
];

export default function ConfirmTeacher({ teachers = [] }: ConfirmTeacherProps) {
    const { post } = useForm();
    const [users, setUsers] = useState<Staff[]>([]);
    const [sortedUsers, setSortedUsers] = useState<Staff[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
    const [processingIds, setProcessingIds] = useState<{ [key: string]: boolean }>({});
    const [processedTeachers, setProcessedTeachers] = useState<Staff[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState<number>(0);

    // Memproses data guru untuk normalisasi struktur data
    useEffect(() => {
        if (!teachers || teachers.length === 0) {
            setProcessedTeachers([]);
            return;
        }

        // Normalisasi data untuk memastikan konsistensi
        const normalized = teachers.map((teacher) => {
            const isActiveTrue = teacher.is_active === 1 || teacher.is_active === true;
            const isActiveFalse = teacher.is_active === 0 || teacher.is_active === false;

            const name = teacher.name || teacher.user?.name || 'Nama tidak tersedia';
            const nip = teacher.nip || teacher.staff?.nip || '-';
            const nuptk = teacher.nuptk || teacher.staff?.nuptk || '-';

            return {
                ...teacher,
                is_active_true: isActiveTrue,
                is_active_false: isActiveFalse,
                name,
                nip,
                nuptk,
            };
        });
        setProcessedTeachers(normalized);
    }, [teachers]);

    useEffect(() => {
        const controller = new AbortController();
        fetchStaffUsers(controller.signal);
        return () => controller.abort();
    }, [retryCount]); // Dependency on retryCount allows manual refresh

    useEffect(() => {
        setSortedUsers([...users]);
    }, [users]);

    // Fallback to use provided teachers if API fails
    useEffect(() => {
        if (error && teachers && teachers.length > 0) {
            // Use the prop data as fallback
            const activeTeachers = teachers.filter((teacher) => {
                // Check for is_active property directly or in teacher property
                const isActive =
                    teacher.is_active === true ||
                    teacher.is_active === 1 ||
                    (teacher.teacher && (teacher.teacher.is_active === true || teacher.teacher.is_active === 1));
                return isActive;
            });

            setUsers(activeTeachers);
        }
    }, [error, teachers]);

    const fetchStaffUsers = async (signal?: AbortSignal) => {
        setLoading(true);
        setError(null);

        try {
            // Try primary endpoint with route helper
            let response;
            try {
                response = await axios.get(route('staffadmin.get-teacher'), { signal });
            } catch (err) {
                // informasi gagal mengambil data
                console.error('Gagal memuat data staff:', err);
            }

            // Check if response data has the expected structure
            if (response.data && (Array.isArray(response.data) || response.data.data)) {
                // Make sure we handle both array response and response with data property
                const staffData = Array.isArray(response.data) ? response.data : response.data.data;

                if (Array.isArray(staffData)) {
                    // More flexible filtering that handles different data structures
                    const activeTeachers = staffData.filter((staff: Staff) => {
                        // Check if staff exists and has required properties
                        if (!staff) return false;

                        // Check for teacher property existence first
                        if (staff.teacher) {
                            // Handle different representations of is_active in teacher
                            return staff.teacher.is_active === true || staff.teacher.is_active === 1;
                        }

                        // Directly check is_active on staff if no teacher property
                        return staff.is_active === true || staff.is_active === 1;
                    });

                    setUsers(activeTeachers);
                    setError(null);
                } else {
                    throw new Error('Data bukan dalam bentuk array');
                }
            } else {
                console.error('Unexpected response format:', response.data);
                throw new Error('Format data tidak sesuai');
            }
        } catch (error) {
            console.error('Gagal memuat data staff:', error);

            // Set error state
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    const errorMsg = `Gagal memuat data guru: ${error.response.status} ${error.response.statusText}`;
                    setError(errorMsg);
                    showAlert('error', errorMsg);

                    // If 500 error, show additional guidance
                    if (error.response.status === 500) {
                        showAlert('info', 'Terjadi kesalahan server. Hubungi administrator sistem.', 5000);
                    }
                } else if (error.request) {
                    // The request was made but no response was received
                    setError('Tidak ada respons dari server');
                    showAlert('error', 'Tidak ada respons dari server. Periksa koneksi internet Anda.');
                } else {
                    // Something happened in setting up the request that triggered an Error
                    setError(error.message);
                    showAlert('error', `Terjadi kesalahan: ${error.message}`);
                }
            } else if (error instanceof Error) {
                setError(error.message);
                showAlert('error', `Terjadi kesalahan: ${error.message}`);
            } else {
                setError('Unknown error');
                showAlert('error', 'Gagal memuat data guru. Silakan coba lagi.');
            }

            // Use prop data as fallback
            if (teachers && teachers.length > 0) {
                const activeTeachers = teachers.filter((teacher) => {
                    const isActive =
                        teacher.is_active === true ||
                        teacher.is_active === 1 ||
                        (teacher.teacher && (teacher.teacher.is_active === true || teacher.teacher.is_active === 1));
                    return isActive;
                });

                if (activeTeachers.length > 0) {
                    setUsers(activeTeachers);
                    showAlert('warning', 'Menggunakan data cache. Beberapa data mungkin tidak terbaru.', 5000);
                }
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

    const confirmTeacher: FormEventHandler<HTMLButtonElement> = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (!id) return;

        if (confirm('Apakah Anda yakin ingin mengonfirmasi guru ini?')) {
            setProcessingIds((prev) => ({ ...prev, [id]: true }));

            // Try using both route helper method and direct URL as fallback
            const url = (() => {
                try {
                    return route('confirm.teacher.update', { teacher: id });
                } catch (e) {
                    return `/staffadmin/confirm-teacher/${id}`;
                }
            })();

            post(url, {
                onSuccess: () => {
                    // Show success message
                    showAlert('success', 'Guru berhasil dikonfirmasi!');

                    // Refresh the data
                    setRetryCount((prev) => prev + 1);
                },
                onError: (errors) => {
                    // Show error message with details if available
                    const errorMessage = Object.values(errors).flat().join(', ');
                    showAlert('error', errorMessage || 'Gagal mengonfirmasi guru.');
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
    const activeTeachers = processedTeachers.filter((t) => t.is_active_true);
    const inactiveTeachers = processedTeachers.filter((t) => t.is_active_false);

    const [searchTerm, setSearchTerm] = useState('');

    return (
        <AppLayoutStaffAdmin breadcrumbs={breadcrumbs}>
            <Head title="Konfirmasi Guru" />

            <div className="min-h-screen bg-gray-50 pb-12 dark:bg-gray-900">
                {/* Dashboard Header */}
                <div className="bg-white shadow-sm dark:bg-gray-800">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        <div className="flex flex-col items-start justify-between md:flex-row md:items-center">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Konfirmasi Guru</h1>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Kelola dan pantau proses konfirmasi guru dalam sistem</p>
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
                        {/* Total Guru */}
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
                                            <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Total Guru</dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                                    {sortedUsers.filter((staff) => staff.teacher).length}
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
                                                <div className="text-2xl font-semibold text-gray-900 dark:text-white">{inactiveTeachers.length}</div>
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
                                                    {sortedUsers.filter((staff) => staff.teacher).length - activeTeachers.length}
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
                                        Guru yang Perlu Dikonfirmasi
                                    </h3>
                                    <span className="mt-2 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 sm:mt-0 dark:bg-yellow-900 dark:text-yellow-200">
                                        {inactiveTeachers.length} menunggu
                                    </span>
                                </div>
                            </div>

                            {inactiveTeachers.length > 0 ? (
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {inactiveTeachers.map((teacher) => (
                                        <li key={teacher.id}>
                                            <div className="px-4 py-4 hover:bg-gray-50 sm:px-6 dark:hover:bg-gray-700">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600">
                                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                                                    {teacher.name.substring(0, 2).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{teacher.name}</div>
                                                            <div className="mt-1 flex items-center">
                                                                <div className="mr-2 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                                                    NIP: {teacher.nip || 'Tidak Ada'}
                                                                </div>
                                                                <div className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                                                    NUPTK: {teacher.nuptk || 'Tidak Ada'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Button
                                                            data-id={teacher.id}
                                                            onClick={confirmTeacher}
                                                            disabled={processingIds[teacher.id]}
                                                            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm leading-4 font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:bg-gray-400"
                                                        >
                                                            {processingIds[teacher.id] ? (
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
                                        Tidak ada guru yang perlu dikonfirmasi
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Semua guru telah terkonfirmasi dalam sistem.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Confirmed Teachers Section */}
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
                                        Guru yang Sudah Dikonfirmasi
                                    </h3>

                                    <div className="mt-2 flex items-center space-x-2 sm:mt-0">
                                        <div className="relative rounded-md shadow-sm">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                <svg
                                                    className="h-5 w-5 text-gray-400"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </div>
                                            <div className="relative w-full max-w-md">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="24"
                                                        height="24"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        stroke-width="2"
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        class="lucide lucide-search-icon lucide-search"
                                                    >
                                                        <circle cx="11" cy="11" r="8" />
                                                        <path d="m21 21-4.3-4.3" />
                                                    </svg>
                                                </span>
                                                <input
                                                    type="text"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    placeholder="Cari Nama Guru..."
                                                    className="w-full rounded-md border border-gray-300 bg-white py-2 pr-4 pl-10 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {loading ? (
                                <div className="px-4 py-12 text-center sm:px-6">
                                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Memuat data guru...</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300"
                                                >
                                                    Nama
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300"
                                                >
                                                    Email
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300"
                                                >
                                                    NIP
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300"
                                                >
                                                    NUPTK
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300"
                                                >
                                                    Bagian
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300"
                                                >
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                            <AnimatePresence initial={false}>
                                                {sortedUsers.filter(
                                                    (staff) => staff.teacher && staff.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
                                                ).length > 0 ? (
                                                    sortedUsers
                                                        .filter(
                                                            (staff) =>
                                                                staff.teacher && staff.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
                                                        )
                                                        .map((staff, index) => (
                                                            <motion.tr
                                                                key={staff.id}
                                                                custom={index}
                                                                layout
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
                                                                exit={{ opacity: 0, y: -10, transition: { duration: 0.2, delay: index * 0.05 } }}
                                                                className="transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                            >
                                                                <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white">
                                                                    {staff.user?.name || 'N/A'}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                                    {staff.user?.email || 'N/A'}
                                                                </td>
                                                                <td className="px-6 py-4 text-center font-mono text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                                    {staff.nip || '-'}
                                                                </td>
                                                                <td className="px-6 py-4 text-center font-mono text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                                    {staff.nuptk || '-'}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                                    {staff.teacher?.name || 'Tidak ada'}
                                                                </td>
                                                                <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                                                                    <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs leading-5 font-semibold text-green-800 dark:bg-green-900 dark:text-green-200">
                                                                        Aktif
                                                                    </span>
                                                                </td>
                                                            </motion.tr>
                                                        ))
                                                ) : (
                                                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.3 } }}>
                                                        <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                                            {error ? (
                                                                <div>
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
                                                                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                                                        />
                                                                    </svg>
                                                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                        Gagal memuat data
                                                                    </h3>
                                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                                        Silakan coba refresh halaman.
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <div>
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
                                                                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                                                        />
                                                                    </svg>
                                                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                        Tidak ada data
                                                                    </h3>
                                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                                        Belum ada guru yang dikonfirmasi dalam sistem.
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </motion.tr>
                                                )}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayoutStaffAdmin>
    );
}