import AppLayoutStaffAdmin from '@/layouts/staffadmin/app-layout-staffadmin';
import { Head, useForm, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Edit, Filter, Plus, Search, Trash, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

const breadcrumbs = [
    { title: 'Dashboard Staff Admin', href: '/staffadmin/dashboard' },
    { title: 'Mata Pelajaran', href: '/staffadmin/subjects' },
];

export default function Subjects({ subjects: initialSubjects, teachers }) {
    const [subjects, setSubjects] = useState(initialSubjects);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showActiveOnly, setShowActiveOnly] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        id: null,
        name: '',
        teacher_id: null,
        is_active: true,
    });

    const handleModalOpen = (subject = null) => {
        reset();
        if (subject) {
            setData({
                id: subject.id,
                name: subject.name,
                teacher_id: subject.teacher_id,
                is_active: subject.is_active,
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (data.id) {
            put(route('staffadmin.subjects.update', { subject: data.id }), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    toast.success('Mata pelajaran berhasil diperbarui');

                    setSubjects((prev) =>
                        prev.map((s) =>
                            s.id === data.id
                                ? {
                                      ...s,
                                      name: data.name,
                                      teacher_id: data.teacher_id,
                                      is_active: data.is_active,
                                      teacher: data.teacher_id ? teachers.find((t) => t.id === data.teacher_id) : undefined,
                                  }
                                : s,
                        ),
                    );
                    reset();
                }
            });
        } else {
            post(route('staffadmin.subjects.store'), {
                onSuccess: (response) => {
                    setIsModalOpen(false);
                    toast.success('Mata pelajaran berhasil ditambahkan');

                    if (response?.props?.subjects) {
                        const newSubject = response.props.subjects.find(
                            (s) => s.name === data.name && s.teacher_id === data.teacher_id
                        );
                        if (newSubject) setSubjects((prev) => [...prev, newSubject]);
                    }
                    reset();
                }
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus mata pelajaran ini?')) {
            router.delete(route('staffadmin.subjects.delete', { subject: id }), {
                onSuccess: () => {
                    toast.success('Mata pelajaran berhasil dihapus');
                    setSubjects((prev) => prev.filter((s) => s.id !== id));
                },
                onError: () => {
                    toast.error('Gagal menghapus mata pelajaran');
                },
            });
        }
    };

    const handleBulkDelete = () => {
        if (selectedSubjects.length === 0) {
            toast.error('Tidak ada mata pelajaran yang dipilih');
            return;
        }

        if (confirm(`Apakah Anda yakin ingin menghapus ${selectedSubjects.length} mata pelajaran?`)) {
            router.delete(route('staffadmin.subjects.bulk-delete'), {
                data: { ids: selectedSubjects },
                onSuccess: () => {
                    toast.success(`${selectedSubjects.length} mata pelajaran berhasil dihapus`);
                    setSubjects((prev) => prev.filter((s) => !selectedSubjects.includes(s.id)));
                    setSelectedSubjects([]);
                },
                onError: () => toast.error('Gagal menghapus mata pelajaran')
            });
        }
    };

    const toggleSelectAll = () => {
        setSelectedSubjects(selectedSubjects.length === filteredSubjects.length ? [] : filteredSubjects.map((s) => s.id));
    };

    const toggleSelectSubject = (id) => {
        setSelectedSubjects((prev) => (prev.includes(id) ? prev.filter((subjectId) => subjectId !== id) : [...prev, id]));
    };

    const filteredSubjects = subjects.filter((subject) => {
        const matchesSearch =
            subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (subject.teacher?.staff?.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSearch && (!showActiveOnly || subject.is_active);
    });

    // Animation variants
    const fadeIn = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } },
    };

    const tableRowVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.05,
                duration: 0.3,
            },
        }),
        exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1, transition: { type: 'spring', damping: 25 } },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
    };

    return (
        <AppLayoutStaffAdmin breadcrumbs={breadcrumbs}>
            <Head title="Mata Pelajaran - Tata Usaha" />
            <motion.div className="min-h-screen w-full" initial="hidden" animate="visible" variants={fadeIn}>
                <div className="relative bg-white text-gray-800 dark:bg-gray-900 dark:text-white">
                    <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
                        <h1 className="text-2xl font-semibold">Daftar Mata Pelajaran</h1>
                        <motion.button
                            onClick={() => handleModalOpen()}
                            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Plus size={20} />
                            <span>Mata Pelajaran</span>
                        </motion.button>
                    </div>

                    <div className="p-4">
                        <div className="mb-4 flex flex-col gap-3 md:flex-row">
                            <div className="flex flex-1 items-center rounded-md border border-gray-200 bg-gray-100 px-3 dark:border-gray-700 dark:bg-gray-800">
                                <Search size={20} className="text-gray-500 dark:text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari mata pelajaran atau guru..."
                                    className="w-full bg-transparent py-2 pl-2 text-gray-800 outline-none dark:text-white"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <motion.button onClick={() => setSearchQuery('')} whileTap={{ scale: 0.9 }}>
                                        <X size={20} className="text-gray-500 dark:text-gray-400" />
                                    </motion.button>
                                )}
                            </div>

                            <motion.button
                                className={`flex items-center gap-2 rounded-md px-4 py-2 md:h-10 md:py-0 ${
                                    showActiveOnly
                                        ? 'border border-gray-200 bg-gray-100 text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white'
                                        : 'border border-blue-200 bg-blue-50 text-blue-700'
                                }`}
                                onClick={() => setShowActiveOnly(!showActiveOnly)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Filter size={20} />
                                <span>{showActiveOnly ? 'Semua' : 'Aktif Saja'}</span>
                            </motion.button>

                            {selectedSubjects.length > 0 && (
                                <motion.button
                                    className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
                                    onClick={handleBulkDelete}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Trash size={20} />
                                    <span>Hapus {selectedSubjects.length} Item</span>
                                </motion.button>
                            )}
                        </div>

                        {/* Desktop Table View */}
                        <div className={isMobile ? 'hidden' : 'block'}>
                            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="w-10 px-3 py-3.5 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSubjects.length === filteredSubjects.length && filteredSubjects.length > 0}
                                                    onChange={toggleSelectAll}
                                                    className="h-4 w-4 rounded border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-700"
                                                />
                                            </th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold">ID</th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold">Nama Mata Pelajaran</th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold">Guru Pengajar</th>
                                            <th className="px-3 py-3.5 text-left text-sm font-semibold">Status Mata Pelajaran</th>
                                            <th className="px-3 py-3.5 text-right text-sm font-semibold">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                        <AnimatePresence>
                                            {filteredSubjects.length > 0 ? (
                                                filteredSubjects.map((subject, i) => (
                                                    <motion.tr
                                                        key={subject.id}
                                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                                        custom={i}
                                                        variants={tableRowVariants}
                                                        initial="hidden"
                                                        animate="visible"
                                                        exit="exit"
                                                    >
                                                        <td className="px-3 py-4 whitespace-nowrap">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedSubjects.includes(subject.id)}
                                                                onChange={() => toggleSelectSubject(subject.id)}
                                                                className="h-4 w-4 rounded border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-700"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-4 text-sm whitespace-nowrap">{subject.id}</td>
                                                        <td className="px-3 py-4 text-sm whitespace-nowrap">{subject.name}</td>
                                                        <td className="px-3 py-4 text-sm whitespace-nowrap">
                                                            {subject.teacher?.staff?.user?.name || 'Belum ditentukan'}
                                                        </td>
                                                        <td className="px-3 py-4 text-sm whitespace-nowrap">
                                                            <span
                                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                                    subject.is_active
                                                                        ? 'bg-green-500/10 text-green-500'
                                                                        : 'bg-red-500/10 text-red-500'
                                                                }`}
                                                            >
                                                                {subject.is_active ? 'Aktif' : 'Tidak Aktif'}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-4 text-right text-sm whitespace-nowrap">
                                                            <div className="flex justify-end gap-2">
                                                                <motion.button
                                                                    onClick={() => handleModalOpen(subject)}
                                                                    className="rounded p-1 text-blue-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                                    title="Edit"
                                                                    whileHover={{ scale: 1.2 }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                >
                                                                    <Edit size={16} />
                                                                </motion.button>
                                                                <motion.button
                                                                    onClick={() => handleDelete(subject.id)}
                                                                    className="rounded p-1 text-red-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                                    title="Hapus"
                                                                    whileHover={{ scale: 1.2 }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                >
                                                                    <Trash size={16} />
                                                                </motion.button>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                ))
                                            ) : (
                                                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                                                    <td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                                        Tidak ada data mata pelajaran
                                                    </td>
                                                </motion.tr>
                                            )}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className={isMobile ? 'block' : 'hidden'}>
                            <div className="space-y-2">
                                <AnimatePresence>
                                    {filteredSubjects.length > 0 ? (
                                        filteredSubjects.map((subject, i) => (
                                            <motion.div
                                                key={subject.id}
                                                className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                                                custom={i}
                                                variants={tableRowVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="exit"
                                                layout
                                            >
                                                <div className="mb-2 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedSubjects.includes(subject.id)}
                                                            onChange={() => toggleSelectSubject(subject.id)}
                                                            className="h-4 w-4 rounded border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-700"
                                                        />
                                                        <span className="font-medium">{subject.name}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <motion.button
                                                            onClick={() => handleModalOpen(subject)}
                                                            className="rounded p-1.5 text-blue-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                            title="Edit"
                                                            whileHover={{ scale: 1.2 }}
                                                            whileTap={{ scale: 0.9 }}
                                                        >
                                                            <Edit size={20} />
                                                        </motion.button>
                                                        <motion.button
                                                            onClick={() => handleDelete(subject.id)}
                                                            className="rounded p-1.5 text-red-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                            title="Hapus"
                                                            whileHover={{ scale: 1.2 }}
                                                            whileTap={{ scale: 0.9 }}
                                                        >
                                                            <Trash size={20} />
                                                        </motion.button>
                                                    </div>
                                                </div>
                                                <div className="space-y-1 pl-6 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500 dark:text-gray-400">ID:</span>
                                                        <span>{subject.id}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500 dark:text-gray-400">Guru:</span>
                                                        <span>{subject.teacher?.staff?.user?.name || 'Belum ditentukan'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500 dark:text-gray-400">Status Mata Pelajaran:</span>
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                                subject.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                                            }`}
                                                        >
                                                            {subject.is_active ? 'Aktif' : 'Tidak Aktif'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <motion.div
                                            className="rounded-lg border border-gray-200 bg-white p-4 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            Tidak ada data mata pelajaran
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Modal for adding/editing a subject */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <motion.div
                            className="m-4 w-full max-w-md rounded-lg bg-white p-6 text-gray-800 shadow-lg dark:bg-gray-800 dark:text-white"
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <h2 className="mb-4 text-xl font-bold">{data.id ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}</h2>

                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label htmlFor="name" className="mb-2 block text-sm font-medium">
                                        Nama Mata Pelajaran
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        placeholder="Masukkan nama mata pelajaran"
                                        required
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="teacher_id" className="mb-2 block text-sm font-medium">
                                        Guru Pengajar
                                    </label>
                                    <select
                                        id="teacher_id"
                                        value={data.teacher_id || ''}
                                        onChange={(e) => setData('teacher_id', e.target.value ? parseInt(e.target.value) : null)}
                                        className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="">-- Pilih Guru --</option>
                                        {teachers.map((teacher) => (
                                            <option key={teacher.id} value={teacher.id}>
                                                {teacher.staff?.user?.name || 'Nama tidak tersedia'}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.teacher_id && <p className="mt-1 text-sm text-red-500">{errors.teacher_id}</p>}
                                </div>

                                <div className="mb-6">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                            className="h-4 w-4 rounded border border-gray-300 bg-gray-50 text-blue-600 dark:border-gray-600 dark:bg-gray-700"
                                        />
                                        <span className="ml-2 text-sm">Aktif</span>
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <motion.button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Batal
                                    </motion.button>
                                    <motion.button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-70"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {processing ? 'Menyimpan...' : 'Simpan'}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AppLayoutStaffAdmin>
    );
}