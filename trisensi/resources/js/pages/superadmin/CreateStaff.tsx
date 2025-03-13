import AppLayoutSuperAdmin from '@/layouts/superadmin/app-layout-superadmin';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard Super Admin', href: '/superadmin/dashboard' },
    { title: 'Buat Akun Tata Usaha', href: '/superadmin/adm' },
];

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
    admin_staff: {
        name: string;
    };
}

// Define animation variants
const checkboxVariants = {
    checked: { scale: 1.2, transition: { duration: 0.2 } },
    unchecked: { scale: 1, transition: { duration: 0.2 } },
};

const rowVariants = {
    hidden: {
        opacity: 0,
        x: -300,
        transition: { duration: 0.5 },
    },
    visible: (custom: number) => ({
        opacity: 1,
        x: 0,
        transition: {
            delay: custom * 0.05,
            duration: 0.3,
        },
    }),
    exit: {
        opacity: 0,
        x: -300,
        transition: { duration: 0.3 },
    },
};

// Define modal animation variants
const modalBackdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
};

const modalContentVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.8 },
    visible: { 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        transition: { 
            type: "spring", 
            damping: 25, 
            stiffness: 500 
        } 
    },
    exit: { 
        opacity: 0, 
        y: 20, 
        scale: 0.8, 
        transition: { 
            duration: 0.2 
        } 
    },
};

export default function CreateStaff() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
    });
    const [users, setUsers] = useState<Staff[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
    const [sortedUsers, setSortedUsers] = useState<Staff[]>([]);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        fetchStaffUsers(controller.signal);
        return () => controller.abort();
    }, []);

    useEffect(() => {
        setSortedUsers([...users]);
    }, [users]);

    const fetchStaffUsers = async (signal?: AbortSignal) => {
        try {
            const response = await axios.get('/superadmin/adm/get-staff', { signal });
            setUsers(response.data);
        } catch (error) {
            console.error('Gagal memuat data staff:', error);
            showAlert('error', 'Gagal memuat data staff. Silakan coba lagi.');
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

    const submitForm = (e: React.FormEvent) => {
        e.preventDefault();
        post('/superadmin/adm/create-staff', {
            preserveScroll: true,
            onSuccess: () => {
                setData({ name: '', email: '', password: '' });
                fetchStaffUsers();
                showAlert('success', 'Staff berhasil ditambahkan!');
            },
            onError: (errors) => {
                let errorMessage = 'Terjadi kesalahan.';
                if (errors.email) errorMessage = 'Email sudah digunakan.';
                showAlert('error', errorMessage);
            },
        });
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

    const handleDeleteSelected = async () => {
        if (selectedUsers.size === 0) {
            showAlert('warning', 'Pilih minimal satu pengguna untuk dihapus.');
            return;
        }
        setShowConfirmDialog(true);
    };

    const confirmDelete = async () => {
        try {
            // Optimistically update UI
            const newSortedUsers = sortedUsers.filter((user) => !selectedUsers.has(user.id));
            setSortedUsers(newSortedUsers);
            
            // Hide confirmation dialog
            setShowConfirmDialog(false);
            
            // Show deletion in progress alert
            showAlert('info', 'Menghapus data...', 500);
            
            // Process the deletion
            setTimeout(async () => {
                await axios.post('/superadmin/adm/delete-staff-multiple', { ids: Array.from(selectedUsers) });
                showAlert('success', 'Data berhasil dihapus!');
                setSelectedUsers(new Set());
                fetchStaffUsers();
            }, 500);
        } catch (error) {
            showAlert('error', 'Gagal menghapus data.');
            console.error('Gagal menghapus:', error);
        }
    };

    const cancelDelete = () => {
        setShowConfirmDialog(false);
    };

    return (
        <AppLayoutSuperAdmin breadcrumbs={breadcrumbs}>
            <Head title="Buat Akun Tata Usaha - Super Admin" />
            <div className="bg-gray-50 p-3 sm:p-4 md:p-6 dark:bg-gray-900">
                <div className="rounded-xl border bg-white p-4 sm:p-6 shadow-md dark:bg-gray-800">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">Buat Akun Tata Usaha</h1>
                    <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">Gunakan formulir ini untuk menambahkan akun baru.</p>
                    
                    {/* Form responsive */}
                    <form onSubmit={submitForm} className="mt-4 md:mt-6 space-y-3 md:space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            <div>
                                <input
                                    type="text"
                                    name="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    className="w-full rounded-lg border bg-gray-100 p-2 sm:p-3 dark:bg-gray-700"
                                    placeholder="Nama"
                                />
                                {errors.name && <p className="text-xs sm:text-sm text-red-500">{errors.name}</p>}
                            </div>
                            <div>
                                <input
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    className="w-full rounded-lg border bg-gray-100 p-2 sm:p-3 dark:bg-gray-700"
                                    placeholder="Email"
                                />
                                {errors.email && <p className="text-xs sm:text-sm text-red-500">{errors.email}</p>}
                            </div>
                        </div>
                        <div>
                            <input
                                type="password"
                                name="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required
                                className="w-full rounded-lg border bg-gray-100 p-2 sm:p-3 dark:bg-gray-700"
                                placeholder="Password"
                            />
                            {errors.password && <p className="text-xs sm:text-sm text-red-500">{errors.password}</p>}
                        </div>
                        
                        <div className="mt-4 md:mt-6 flex flex-col sm:flex-row w-full items-center justify-between gap-2">
                            <motion.button
                                onClick={handleDeleteSelected}
                                onKeyDown={(e) => e.key === 'Enter' && handleDeleteSelected()}
                                className="w-full sm:w-auto rounded-lg bg-red-600 px-3 py-2 text-sm md:text-base text-white hover:bg-red-700"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                type="button"
                                disabled={selectedUsers.size === 0}
                            >
                                Hapus Terpilih ({selectedUsers.size})
                            </motion.button>
                            <button 
                                type="submit" 
                                className="w-full sm:w-auto rounded-lg bg-blue-600 px-3 py-2 text-sm md:text-base text-white hover:bg-blue-700" 
                                disabled={processing}
                            >
                                {processing ? 'Membuat...' : 'Buat Akun'}
                            </button>
                        </div>
                    </form>
                    
                    {/* Tabel untuk tampilan desktop/tablet (md dan ke atas) */}
                    <div className="mt-4 md:mt-6 hidden md:block">
                        <div className="overflow-x-auto">
                            <div className="min-w-full inline-block align-middle">
                                <div className="overflow-hidden border rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                            <tr>
                                                <th scope="col" className="p-2 sm:p-3 text-center">
                                                    <motion.div whileTap={{ scale: 0.95 }}>
                                                        <input
                                                            type="checkbox"
                                                            onChange={(e) =>
                                                                setSelectedUsers(e.target.checked ? new Set(users.map((staff) => staff.id)) : new Set())
                                                            }
                                                            checked={selectedUsers.size === users.length && users.length > 0}
                                                            className="h-4 w-4 cursor-pointer"
                                                        />
                                                    </motion.div>
                                                </th>
                                                <th scope="col" className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium">Nama</th>
                                                <th scope="col" className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium">Email</th>
                                                <th scope="col" className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium">NIP</th>
                                                <th scope="col" className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium">NUPTK</th>
                                                <th scope="col" className="p-2 sm:p-3 text-left text-xs sm:text-sm font-medium lg:table-cell">Bagian</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            <AnimatePresence initial={false}>
                                                {sortedUsers.length > 0 ? (
                                                    sortedUsers.map((staff, index) => (
                                                        <motion.tr
                                                            key={staff.id}
                                                            custom={index}
                                                            layout
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
                                                            exit={{
                                                                opacity: 0,
                                                                y: -10,
                                                                transition: { duration: 0.2, delay: index * 0.05 },
                                                            }}
                                                            variants={rowVariants}
                                                            className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                                                        >
                                                            <td className="p-2 sm:p-3 text-center">
                                                                <motion.div
                                                                    animate={selectedUsers.has(staff.id) ? 'checked' : 'unchecked'}
                                                                    variants={checkboxVariants}
                                                                    whileTap={{ scale: 1.0 }}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedUsers.has(staff.id)}
                                                                        onChange={() => handleCheckboxChange(staff.id)}
                                                                        className="h-4 w-4 cursor-pointer"
                                                                    />
                                                                </motion.div>
                                                            </td>
                                                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200">{staff.user.name}</td>
                                                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200">{staff.user.email}</td>
                                                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200 text-center">{staff.nip || '-'}</td>
                                                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200 text-center">{staff.nuptk || '-'}</td>
                                                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200">{staff.admin_staff?.name || 'Tidak ada'}</td>
                                                        </motion.tr>
                                                    ))
                                                ) : (
                                                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.3 } }}>
                                                        <td colSpan={6} className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
                                                            Tidak ada data.
                                                        </td>
                                                    </motion.tr>
                                                )}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Card View untuk tampilan mobile (< md) */}
                    <div className="mt-4 md:hidden">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Daftar Akun Tata Usaha</h3>
                            <motion.div whileTap={{ scale: 0.95 }}>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        onChange={(e) =>
                                            setSelectedUsers(e.target.checked ? new Set(users.map((staff) => staff.id)) : new Set())
                                        }
                                        checked={selectedUsers.size === users.length && users.length > 0}
                                        className="h-4 w-4 cursor-pointer mr-1"
                                    />
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Pilih Semua</span>
                                </div>
                            </motion.div>
                        </div>
                        
                        <AnimatePresence initial={false}>
                            {sortedUsers.length > 0 ? (
                                sortedUsers.map((staff, index) => (
                                    <motion.div
                                        key={staff.id}
                                        custom={index}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
                                        exit={{
                                            opacity: 0,
                                            y: -10,
                                            transition: { duration: 0.2, delay: index * 0.05 },
                                        }}
                                        className="mb-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-sm text-gray-900 dark:text-white">{staff.user.name}</span>
                                            <motion.div
                                                animate={selectedUsers.has(staff.id) ? 'checked' : 'unchecked'}
                                                variants={checkboxVariants}
                                                whileTap={{ scale: 1.0 }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.has(staff.id)}
                                                    onChange={() => handleCheckboxChange(staff.id)}
                                                    className="h-4 w-4 cursor-pointer"
                                                />
                                            </motion.div>
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                            {staff.user.email}
                                        </div>
                                        <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 dark:text-gray-400">
                                            <div>NIP: {staff.nip || '-'}</div>
                                            <div>NUPTK: {staff.nuptk || '-'}</div>
                                            <div className="col-span-2">Bagian: {staff.admin_staff?.name || 'Tidak ada'}</div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1, transition: { duration: 0.3 } }}
                                    className="text-center text-sm text-gray-500 dark:text-gray-400 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                                >
                                    Tidak ada data.
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
    
            {/* Custom Confirmation Dialog */}
            <AnimatePresence>
                {showConfirmDialog && (
                    <motion.div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" 
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={modalBackdropVariants}
                    >
                        <motion.div 
                            className="w-full max-w-sm sm:max-w-md rounded-lg bg-white p-4 sm:p-6 shadow-xl dark:bg-gray-800"
                            variants={modalContentVariants}
                        >
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Konfirmasi Penghapusan</h3>
                            <div className="mt-3 sm:mt-4">
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                    Apakah Anda yakin ingin menghapus {selectedUsers.size} data pengguna yang dipilih?
                                </p>
                                <p className="mt-2 text-xs sm:text-sm text-red-500">
                                    Tindakan ini tidak dapat dibatalkan!
                                </p>
                            </div>
                            <div className="mt-4 sm:mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:space-x-2">
                                <motion.button
                                    onClick={cancelDelete}
                                    className="mt-2 sm:mt-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Batal
                                </motion.button>
                                <motion.button
                                    onClick={confirmDelete}
                                    className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Ya, Hapus
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AppLayoutSuperAdmin>
    );
}