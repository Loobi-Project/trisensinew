import AppLayoutStaffAdmin from '@/layouts/staffadmin/app-layout-staffadmin';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    AlertTriangle,
    Calendar,
    CheckCircle,
    Download,
    FileEdit,
    FilePlus,
    FileText,
    Plus,
    Save,
    Search,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { FormEvent, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard Staff Admin',
        href: '/staffadmin/dashboard',
    },
    {
        title: 'Template Surat Izin',
        href: '/staffadmin/attendance-template',
    },
];

type AbsenceLetterTemplate = {
    id: number;
    name: string;
    file_path: string;
    timestamp: string;
};

type Props = {
    templates: AbsenceLetterTemplate[];
};

// Animation variants
const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } },
};

const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const buttonHover = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95, transition: { duration: 0.1 } },
};

export default function AttendanceTemplatePage({ templates }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        file: null as File | null,
    });
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [previewId, setPreviewId] = useState<number | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [fileError, setFileError] = useState('');
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    // Filter templates based on search term
    const filteredTemplates = templates.filter((template) => template.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!data.file) {
            setFileError('File harus diupload');
            return;
        }

        setFileError('');
        post(route('staffadmin.attendance.template.store'), {
            onSuccess: () => {
                reset();
                setShowForm(false);
                setShowSuccessMessage(true);
                setTimeout(() => setShowSuccessMessage(false), 5000);
            },
        });
    };

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    };

    const handleDeleteSelected = () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Yakin ingin menghapus ${selectedIds.length} template yang dipilih?`)) return;

        router.post(
            route('staffadmin.attendance.template.bulk-delete'),
            {
                ids: selectedIds,
            },
            {
                onSuccess: () => {
                    setSelectedIds([]);
                    setShowSuccessMessage(true);
                    setTimeout(() => setShowSuccessMessage(false), 5000);
                },
            },
        );
    };

    const handleEdit = (id: number, currentName: string) => {
        setEditingId(id);
        setEditName(currentName);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
    };

    const submitEdit = (id: number) => {
        if (editName.trim() === '') return;

        router.post(
            route('staffadmin.attendance.template.update', { id }),
            {
                name: editName,
            },
            {
                onSuccess: () => {
                    setEditingId(null);
                    setEditName('');
                    setShowSuccessMessage(true);
                    setTimeout(() => setShowSuccessMessage(false), 5000);
                },
            },
        );
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;

        if (file) {
            // Validasi jika file bukan Word (.doc, .docx)
            if (file.type !== 'application/msword' && file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                setFileError('Hanya file Word (.doc atau .docx) yang diperbolehkan.');
                setData('file', null); // Reset file yang dipilih
            } else {
                setFileError(''); // Reset error jika file valid
                setData('file', file); // Set file jika valid
                setFilePreview(URL.createObjectURL(file)); // Set preview jika perlu
            }
        }
    };

    // Format date nicely
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    // Get document preview based on file type
    const getDocumentPreview = (filePath: string) => {
        // Cek apakah nama file adalah Word document
        const isWord = filePath.toLowerCase().endsWith('.docx') || filePath.toLowerCase().endsWith('.doc');

        // Jika bukan Word document, return null atau component peringatan
        if (!isWord) {
            return (
                <div className="flex h-full w-full flex-col border-b border-red-300 bg-red-100">
                    <div className="h-3 w-full bg-red-400/40"></div>
                    <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
                        <AlertCircle size={48} className="text-red-500" />
                        <div className="text-xs text-red-500/70">Format file tidak didukung</div>
                    </div>
                </div>
            );
        }

        // Ekstrak nama file untuk ditampilkan pada cover
        const fileName = filePath.split('/').pop() || '';

        return (
            <div className="flex h-full w-full flex-col border-b border-blue-300 bg-blue-100">
                {/* Header strip untuk Word document */}
                <div className="h-3 w-full bg-blue-400/40"></div>

                {/* Document icon and title */}
                <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
                    <FileText size={48} className="text-blue-500" />
                    <div className="text-xs text-blue-500/70">Word Document</div>
                    <div className="mt-2 max-w-full truncate text-xs">{fileName}</div>
                </div>
            </div>
        );
    };

    return (
        <AppLayoutStaffAdmin breadcrumbs={breadcrumbs}>
            <Head title="Template Surat Izin" />
            <div className="flex w-full">
                <main className="min-h-screen w-full bg-white pb-12 dark:bg-gray-900">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="relative mt-6 min-h-[80vh] flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white p-4 text-gray-900 shadow-sm md:min-h-min md:p-6 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                            {/* Success Message */}
                            <AnimatePresence>
                                {showSuccessMessage && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-100 p-3 text-green-800"
                                    >
                                        <CheckCircle size={18} />
                                        <span>Operasi berhasil dilakukan!</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Header Section */}
                            <div className="mb-6 flex flex-col justify-between border-b border-gray-200 pb-5 md:flex-row md:items-center">
                                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold md:mb-0 md:text-2xl">
                                    <FileText size={24} className="text-blue-600" />
                                    Template Surat Izin
                                </h2>

                                <div className="mt-3 flex items-center gap-3 md:mt-0">
                                    <motion.button
                                        whileHover="hover"
                                        whileTap="tap"
                                        variants={buttonHover}
                                        onClick={() => setShowForm(!showForm)}
                                        className="flex items-center gap-2 rounded-lg border-none bg-blue-600 px-4 py-2 font-semibold text-white transition-colors duration-200 hover:bg-blue-700"
                                    >
                                        {showForm ? <X size={18} /> : <Plus size={18} />}
                                        {showForm ? 'Batal' : 'Tambah Template'}
                                    </motion.button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {showForm && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="mb-10 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800"
                                    >
                                        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                            <FilePlus size={20} className="text-blue-600" />
                                            Upload Template Baru
                                        </h3>

                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Nama Template
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={data.name}
                                                        onChange={(e) => setData('name', e.target.value)}
                                                        className="focus:ring-opacity-50 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 transition-all focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-500"
                                                        placeholder="Masukkan nama template"
                                                    />
                                                    {errors.name && (
                                                        <p className="mt-1 flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                                                            <AlertTriangle size={14} />
                                                            {errors.name}
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        File Template (DOCX)
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            onChange={handleFileChange}
                                                            className="hidden"
                                                            id="template-file"
                                                            accept=".docx,.doc"
                                                        />
                                                        <label
                                                            htmlFor="template-file"
                                                            className="flex w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-gray-600 transition-all duration-300 hover:bg-gray-100 hover:text-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-blue-400"
                                                        >
                                                            <Upload size={20} className="mr-2" />
                                                            {data.file ? data.file.name : 'Pilih file atau drop di sini'}
                                                        </label>
                                                    </div>
                                                    {errors.file && (
                                                        <p className="mt-1 flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                                                            <AlertTriangle size={14} />
                                                            {errors.file}
                                                        </p>
                                                    )}
                                                    {fileError && (
                                                        <p className="mt-1 flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                                                            <AlertTriangle size={14} />
                                                            {fileError}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex justify-end">
                                                <motion.button
                                                    whileHover="hover"
                                                    whileTap="tap"
                                                    variants={buttonHover}
                                                    type="submit"
                                                    disabled={processing}
                                                    className="flex items-center gap-2 rounded-lg border-none bg-blue-600 px-6 py-2 font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
                                                >
                                                    <Save size={18} />
                                                    {processing ? 'Menyimpan...' : 'Simpan Template'}
                                                </motion.button>
                                            </div>
                                        </form>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Search and Actions Row */}
                            <div className="mb-4 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
                                <div className="relative w-full md:w-64">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <Search className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Cari template..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="block w-full rounded-md border border-gray-300 py-2 pr-3 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>

                                <AnimatePresence mode="wait">
                                    {selectedIds.length > 0 && (
                                        <motion.button
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleDeleteSelected}
                                            className="flex items-center gap-2 rounded border-none bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700"
                                        >
                                            <Trash2 size={16} />
                                            Hapus {selectedIds.length} Terpilih
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Template count indicator */}
                            <div className="mb-3 text-sm text-gray-600 dark:text-gray-300">
                                {filteredTemplates.length > 0 ? (
                                    <p>
                                        Menampilkan {filteredTemplates.length} dari {templates.length} template
                                    </p>
                                ) : searchTerm ? (
                                    <p>Tidak ada hasil untuk pencarian "{searchTerm}"</p>
                                ) : (
                                    <p>Belum ada template tersimpan</p>
                                )}
                            </div>

                            <div className="overflow-x-auto">
                                <motion.div
                                    initial="hidden"
                                    animate="visible"
                                    variants={{
                                        visible: {
                                            transition: { staggerChildren: 0.1 },
                                        },
                                    }}
                                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                                >
                                    {filteredTemplates.length > 0 ? (
                                        filteredTemplates.map((template) => (
                                            <motion.div
                                                key={template.id}
                                                variants={staggerItem}
                                                className={`relative overflow-hidden rounded-lg border transition-all duration-300 hover:shadow-lg ${
                                                    selectedIds.includes(template.id)
                                                        ? 'border-blue-400 ring-2 ring-blue-400/30'
                                                        : 'border-gray-200 dark:border-gray-600'
                                                } bg-white dark:bg-gray-800`}
                                            >
                                                {/* Selection checkbox */}
                                                <div className="absolute top-3 left-3 z-10">
                                                    <div
                                                        onClick={() => toggleSelect(template.id)}
                                                        className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded border transition-all duration-300 ${
                                                            selectedIds.includes(template.id)
                                                                ? 'border-blue-500 bg-blue-500'
                                                                : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700'
                                                        }`}
                                                    >
                                                        {selectedIds.includes(template.id) && (
                                                            <svg
                                                                width="14"
                                                                height="14"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                            >
                                                                <path
                                                                    d="M20 6L9 17L4 12"
                                                                    stroke="white"
                                                                    strokeWidth="2"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Document preview section */}
                                                <div className="relative flex h-40 items-center justify-center bg-gray-100 dark:bg-gray-700">
                                                    {previewId !== template.id && getDocumentPreview(template.file_path)}
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        {previewId === template.id && (
                                                            <iframe
                                                                src={`${template.file_path}#page=1&view=FitH`}
                                                                className="h-full w-full border-none"
                                                                title={template.name}
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="absolute top-2 right-2 flex gap-1">
                                                        <motion.a
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            href={template.file_path}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="rounded-full bg-white/80 p-1.5 text-green-600 shadow-sm backdrop-blur-sm transition-all hover:text-green-500 dark:bg-gray-600/60"
                                                            title="Download dokumen"
                                                        >
                                                            <Download size={16} />
                                                        </motion.a>
                                                    </div>
                                                </div>

                                                {/* Template info */}
                                                <div className="p-4">
                                                    {editingId === template.id ? (
                                                        <div className="mb-3 flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={editName}
                                                                onChange={(e) => setEditName(e.target.value)}
                                                                className="flex-1 rounded-md border border-gray-300 bg-white p-1.5 text-gray-900 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-500"
                                                                autoFocus
                                                            />
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => submitEdit(template.id)}
                                                                className="rounded-full bg-green-100 p-1.5 text-green-600 hover:bg-green-200 dark:bg-green-300/10 dark:hover:bg-green-300/20"
                                                                title="Simpan perubahan"
                                                            >
                                                                <CheckCircle size={18} />
                                                            </motion.button>
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={cancelEdit}
                                                                className="rounded-full bg-red-100 p-1.5 text-red-600 hover:bg-red-200 dark:bg-red-300/10 dark:hover:bg-red-300/20"
                                                                title="Batal edit"
                                                            >
                                                                <X size={18} />
                                                            </motion.button>
                                                        </div>
                                                    ) : (
                                                        <h3 className="mb-1 truncate text-lg font-medium text-gray-900 dark:text-white">
                                                            {template.name}
                                                        </h3>
                                                    )}

                                                    <div className="mb-3 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                                        <Calendar size={14} />
                                                        {formatDate(template.timestamp)}
                                                    </div>

                                                    <div className="flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
                                                        {editingId !== template.id && (
                                                            <motion.button
                                                                whileHover="hover"
                                                                whileTap="tap"
                                                                variants={buttonHover}
                                                                onClick={() => handleEdit(template.id, template.name)}
                                                                className="flex items-center gap-1 text-sm text-yellow-600 hover:underline dark:text-yellow-400"
                                                            >
                                                                <FileEdit size={14} />
                                                                Edit
                                                            </motion.button>
                                                        )}
                                                        <a
                                                            href={template.file_path}
                                                            download
                                                            className="flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
                                                        >
                                                            <Download size={14} />
                                                            Unduh
                                                        </a>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <motion.div
                                            variants={staggerItem}
                                            className="col-span-full rounded-xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center dark:border-gray-600 dark:bg-gray-800"
                                        >
                                            {searchTerm ? (
                                                <p className="text-gray-400 dark:text-gray-500">
                                                    Tidak ada template yang cocok dengan pencarian "{searchTerm}".
                                                </p>
                                            ) : (
                                                <div className="flex flex-col items-center gap-3">
                                                    <FileText size={48} className="text-gray-600 dark:text-gray-400" />
                                                    <p className="text-gray-400 dark:text-gray-500">Belum ada template surat izin.</p>
                                                    <button
                                                        onClick={() => setShowForm(true)}
                                                        className="flex items-center gap-2 text-blue-600 hover:underline dark:text-blue-400"
                                                    >
                                                        <Plus size={16} />
                                                        Tambah Template Baru
                                                    </button>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </AppLayoutStaffAdmin>
    );
}
