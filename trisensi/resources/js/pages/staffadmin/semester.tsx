import AppLayoutStaffAdmin from '@/layouts/staffadmin/app-layout-staffadmin';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard Staff Admin',
        href: '/staffadmin/dashboard',
    },
    {
        title: 'Semester',
        href: '/staffadmin/semester',
    },
];

interface Semester {
    id: number;
    batch: string;
}

interface SemesterProps {
    semesters: Semester[];
}

export default function Semester({ semesters = [] }: SemesterProps) {
    const { data, setData, post, reset, errors } = useForm({ batch: '' });
    const [editId, setEditId] = useState<number | null>(null);
    const [editBatch, setEditBatch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sortedSemesters, setSortedSemesters] = useState<Semester[]>([]);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const editInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Focus on the edit input when it appears
        if (editId !== null && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editId]);

    const showNotification = (message: string, type: string) => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification({ show: false, message: '', type: '' });
        }, 3000);
    };

    useEffect(() => {
        console.log('Data semesters:', semesters);
        setSortedSemesters([...semesters]);
    }, [semesters]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        post(route('staffadmin.store-semester'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                showNotification('Semester berhasil ditambahkan', 'success');
                setIsLoading(false);
            },
            onError: () => {
                setIsLoading(false);
            },
        });
    };

    const handleEdit = (semester: Semester) => {
        setEditId(semester.id);
        setEditBatch(String(semester.batch));
    };

    // Fixed handleUpdate function
    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (editId === null) return;
        setIsLoading(true);

        // Use useForm's put method directly instead of router.post
        router.put(
            route('staffadmin.update-semester', editId),
            { batch: editBatch },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditId(null);
                    setEditBatch('');
                    showNotification('Semester berhasil diperbarui', 'success');
                    setIsLoading(false);

                    // Update the local state
                    setSortedSemesters((prevSemesters) => prevSemesters.map((sem) => (sem.id === editId ? { ...sem, batch: editBatch } : sem)));
                },
                onError: (errors) => {
                    console.error('Update errors:', errors);
                    setIsLoading(false);
                    showNotification('Gagal memperbarui semester', 'error');
                },
            },
        );
    };

    const handleDelete = (id: number, batch: string) => {
        const modal = document.getElementById('delete-modal') as HTMLDialogElement;
        if (modal) {
            setEditId(id);
            modal.showModal();
        }
    };

    const confirmDelete = () => {
        if (editId === null) return;
        setIsLoading(true);

        router.delete(route('staffadmin.semester-destroy', editId), {
            preserveScroll: true,
            onSuccess: () => {
                showNotification('Semester berhasil dihapus', 'success');
                setIsLoading(false);
                setEditId(null);
                const modal = document.getElementById('delete-modal') as HTMLDialogElement;
                if (modal) {
                    modal.close();
                }
            },
            onError: () => {
                setIsLoading(false);
            },
        });
    };

    const cancelDelete = () => {
        setEditId(null);
        const modal = document.getElementById('delete-modal') as HTMLDialogElement;
        if (modal) {
            modal.close();
        }
    };

    // Handle escape key for edit mode
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setEditId(null);
            setEditBatch('');
        }
    };

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (semesters) {
            const sorted = [...semesters].sort((a, b) => b.batch - a.batch);
            setSortedSemesters(sorted);
        }
    }, [semesters]);

    useEffect(() => {
        if (editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editId]);

    // Calculate pagination values
    const totalPages = Math.ceil(sortedSemesters.length / itemsPerPage);
    const paginatedSemesters = sortedSemesters.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Handle page change
    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <AppLayoutStaffAdmin breadcrumbs={breadcrumbs}>
            <Head title="Semester - Tata Usaha" />
            <div className="flex w-full">
                <main className="min-h-screen w-full bg-white pb-12 dark:bg-gray-900">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="relative mt-6 min-h-[80vh] flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white p-4 text-gray-900 shadow-sm md:min-h-min md:p-6 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                            {/* Notification */}
                            <AnimatePresence>
                                {notification.show && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className={`alert ${notification.type === 'success' ? 'alert-success bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'alert-error bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'} mb-6 shadow-md`}
                                    >
                                        {notification.message}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-8">
                                <div className="flex flex-col border-b border-gray-200 pb-5 md:flex-row md:items-center md:justify-between dark:border-gray-700">
                                    <h2 className="mb-4 text-xl font-bold md:mb-0 md:text-2xl">Manajemen Semester</h2>

                                    {/* Form Tambah Semester */}
                                    <motion.form
                                        onSubmit={handleSubmit}
                                        className="flex flex-col gap-3 sm:flex-row"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <div className="w-full sm:w-auto">
                                            <input
                                                type="text"
                                                placeholder="Contoh: 1"
                                                value={data.batch}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (/^\d{0,2}$/.test(value)) {
                                                        setData('batch', value);
                                                    }
                                                }}
                                                className="input input-bordered focus:ring-opacity-50 w-full border-gray-300 bg-white text-gray-900 transition-colors duration-200 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-700"
                                            />
                                            {errors.batch && <div className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.batch}</div>}
                                        </div>
                                        <button
                                            type="submit"
                                            className={`btn ${isLoading ? 'loading' : ''} border-none bg-blue-600 text-white transition-colors duration-200 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800`}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? 'Menambahkan...' : 'Tambah'}
                                        </button>
                                    </motion.form>
                                </div>

                                {/* Tabel Semester */}
                                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm dark:border-gray-700">
                                    <table className="table w-full">
                                        <thead className="bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Batch</th>
                                                <th className="px-4 py-3 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            <AnimatePresence initial={false}>
                                                {paginatedSemesters.filter((semester) => semester.id && semester.batch).length > 0 ? (
                                                    paginatedSemesters.map((semester, index) => (
                                                        <motion.tr
                                                            key={semester.id}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10 }}
                                                            transition={{ delay: index * 0.05, duration: 0.2 }}
                                                            className="bg-white transition-colors duration-150 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                                                        >
                                                            <td className="px-4 py-3">
                                                                {editId === semester.id ? (
                                                                    <form onSubmit={handleUpdate} className="flex items-center gap-2">
                                                                        <input
                                                                            ref={editInputRef}
                                                                            type="text"
                                                                            value={editBatch}
                                                                            onChange={(e) => {
                                                                                const value = e.target.value;
                                                                                if (/^\d{0,2}$/.test(value)) {
                                                                                    setEditBatch(value);
                                                                                }
                                                                            }}
                                                                            onKeyDown={handleKeyDown}
                                                                            className="input input-bordered input-sm w-full max-w-xs border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                                                        />
                                                                        <div className="flex gap-1">
                                                                            <button
                                                                                type="submit"
                                                                                className="btn btn-sm border-none bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                                                                                disabled={isLoading}
                                                                            >
                                                                                <svg
                                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                                    width="16"
                                                                                    height="16"
                                                                                    viewBox="0 0 24 24"
                                                                                    fill="none"
                                                                                    stroke="currentColor"
                                                                                    strokeWidth="2"
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                >
                                                                                    <path d="M20 6L9 17l-5-5" />
                                                                                </svg>
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setEditId(null)}
                                                                                className="btn btn-sm border-none bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                                                                            >
                                                                                <svg
                                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                                    width="16"
                                                                                    height="16"
                                                                                    viewBox="0 0 24 24"
                                                                                    fill="none"
                                                                                    stroke="currentColor"
                                                                                    strokeWidth="2"
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                >
                                                                                    <line x1="18" y1="6" x2="6" y2="18" />
                                                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                                                </svg>
                                                                            </button>
                                                                        </div>
                                                                    </form>
                                                                ) : (
                                                                    <span className="font-medium text-gray-800 dark:text-gray-200">
                                                                        Semester {semester.batch}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {editId !== semester.id && (
                                                                    <div className="flex justify-center gap-2">
                                                                        <button
                                                                            className="btn btn-sm border-none bg-amber-500 text-white transition-colors duration-200 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
                                                                            onClick={() => handleEdit(semester)}
                                                                        >
                                                                            <svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                width="16"
                                                                                height="16"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                strokeWidth="2"
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                            >
                                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                                            </svg>
                                                                            <span className="ml-1 hidden md:inline">Edit</span>
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-sm border-none bg-red-600 text-white transition-colors duration-200 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                                                                            onClick={() => handleDelete(semester.id, semester.batch)}
                                                                        >
                                                                            <svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                width="16"
                                                                                height="16"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                strokeWidth="2"
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                            >
                                                                                <polyline points="3 6 5 6 21 6" />
                                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                                <line x1="10" y1="11" x2="10" y2="17" />
                                                                                <line x1="14" y1="11" x2="14" y2="17" />
                                                                            </svg>
                                                                            <span className="ml-1 hidden md:inline">Hapus</span>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </motion.tr>
                                                    ))
                                                ) : (
                                                    <tr className="bg-white dark:bg-gray-800">
                                                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    className="h-12 w-12 text-gray-400 dark:text-gray-500"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={1.5}
                                                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                                                    />
                                                                </svg>
                                                                <span className="font-medium">Belum ada data semester</span>
                                                                <p className="text-sm">Tambahkan semester untuk mulai menggunakan fitur ini</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </div>
                                {/* Pagination Controls */}
                                {sortedSemesters.length > itemsPerPage && (
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Menampilkan {Math.min(sortedSemesters.length, (currentPage - 1) * itemsPerPage + 1)} -{' '}
                                            {Math.min(currentPage * itemsPerPage, sortedSemesters.length)} dari {sortedSemesters.length} data
                                        </div>
                                        <div className="flex space-x-1">
                                            <button
                                                onClick={() => goToPage(1)}
                                                disabled={currentPage === 1}
                                                className="btn btn-sm border border-gray-300 bg-white px-2 text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <polyline points="11 17 6 12 11 7"></polyline>
                                                    <polyline points="18 17 13 12 18 7"></polyline>
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => goToPage(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="btn btn-sm border border-gray-300 bg-white px-2 text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <polyline points="15 18 9 12 15 6"></polyline>
                                                </svg>
                                            </button>

                                            {/* Page numbers */}
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                // Determine which page numbers to show
                                                let pageNumber;
                                                if (totalPages <= 5) {
                                                    pageNumber = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNumber = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNumber = totalPages - 4 + i;
                                                } else {
                                                    pageNumber = currentPage - 2 + i;
                                                }

                                                return (
                                                    <button
                                                        key={pageNumber}
                                                        onClick={() => goToPage(pageNumber)}
                                                        className={`btn btn-sm ${
                                                            currentPage === pageNumber
                                                                ? 'border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                                                : 'border border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
                                                        }`}
                                                    >
                                                        {pageNumber}
                                                    </button>
                                                );
                                            })}

                                            <button
                                                onClick={() => goToPage(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="btn btn-sm border border-gray-300 bg-white px-2 text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <polyline points="9 18 15 12 9 6"></polyline>
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => goToPage(totalPages)}
                                                disabled={currentPage === totalPages}
                                                className="btn btn-sm border border-gray-300 bg-white px-2 text-gray-700 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <polyline points="13 17 18 12 13 7"></polyline>
                                                    <polyline points="6 17 11 12 6 7"></polyline>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Delete Confirmation Modal */}
            <dialog id="delete-modal" className="modal">
                <div className="modal-box bg-white text-gray-900 shadow-lg dark:bg-gray-800 dark:text-white">
                    <h3 className="border-b border-gray-200 pb-3 text-lg font-bold dark:border-gray-700">Konfirmasi Hapus</h3>
                    <p className="py-4">Apakah Anda yakin ingin menghapus semester ini? Tindakan ini tidak dapat dibatalkan.</p>
                    <div className="modal-action">
                        <button
                            onClick={cancelDelete}
                            className="btn border border-gray-300 bg-white text-gray-800 transition-colors duration-200 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                        >
                            Batal
                        </button>
                        <button
                            onClick={confirmDelete}
                            className={`btn ${isLoading ? 'loading' : ''} border-none bg-red-600 text-white transition-colors duration-200 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800`}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Menghapus...' : 'Hapus'}
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={cancelDelete}>tutup</button>
                </form>
            </dialog>
        </AppLayoutStaffAdmin>
    );
}
