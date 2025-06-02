import AppLayoutStaffTeacher from '@/layouts/staffteacher/app-layout-staffteacher';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { format, isToday, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    AlertCircle,
    Calendar,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Download,
    FileSpreadsheet,
    Loader2,
    LockIcon,
    Save,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

// Constants and config
const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const breadcrumbs = [
    { title: 'Dashboard Guru', href: '/staffteacher/dashboard' },
    { title: 'Rekap Presensi Siswa', href: '/staffteacher/presence-recap-entry' },
];
const ITEMS_PER_PAGE = 5;
const STUDENTS_PER_PAGE = 10;

// Reusable components
const LoadingState = () => (
    <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
    </div>
);

const EmptyState = ({ icon: Icon, title, description }) => (
    <div className="flex h-40 flex-col items-center justify-center">
        <div className="mb-4 rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
            <Icon className="h-8 w-8" />
        </div>
        <p className="mb-1 text-lg font-medium">{title}</p>
        <p className="text-center text-gray-500 dark:text-gray-400">{description}</p>
    </div>
);

const Pagination = ({ currentPage, totalPages, setCurrentPage, size = 'md' }) => {
    const sizeClasses = size === 'sm' ? 'text-xs px-2 py-1 h-3 w-3' : 'text-sm px-3 py-1 h-4 w-4';
    return totalPages > 1 ? (
        <div className="mt-2 flex items-center justify-between">
            <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className={`flex items-center gap-1 rounded-md ${sizeClasses} disabled:opacity-50`}
            >
                <ChevronLeft className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} /> Sebelumnya
            </button>
            <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>
                Halaman {currentPage} dari {totalPages}
            </span>
            <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`flex items-center gap-1 rounded-md ${sizeClasses} disabled:opacity-50`}
            >
                Berikutnya <ChevronRight className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
            </button>
        </div>
    ) : null;
};

// Utility functions
const formatDate = (dateString) => format(new Date(dateString), 'EEEE, d MMMM yyyy', { locale: id });
const formatStatus = (status) => String(status).charAt(0).toUpperCase() + String(status).slice(1);
const getStatusClass = (status) => {
    const statusMap = {
        hadir: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        izin: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        sakit: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
        alfa: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    };
    return statusMap[status.toLowerCase()] || 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
};

export default function PresenceRecapEntry({ classes, subjects }) {
    // State management
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recappedStudents, setRecappedStudents] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectAll, setSelectAll] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [currentStudentPage, setCurrentStudentPage] = useState(1);

    // The handleExportPDF function should now work correctly since jsPDF is properly imported
    const handleExportPDF = () => {
        if (!recappedStudents.length) return;

        // Create a new jsPDF instance
        const doc = new jsPDF();

        // Add header with school information
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('SMA NEGERI 3 PURWOKERTO', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Jl. Kamandaka, Purwokerto, Jawa Tengah', doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });
        doc.text('Telepon: (0281) 123456', doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });

        // Add horizontal line
        doc.setLineWidth(0.5);
        doc.line(15, 32, doc.internal.pageSize.getWidth() - 15, 32);
        doc.setLineWidth(0.2);
        doc.line(15, 33.5, doc.internal.pageSize.getWidth() - 15, 33.5);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('LAPORAN PRESENSI SISWA', doc.internal.pageSize.getWidth() / 2, 45, { align: 'center' });

        // Get recapped by subject
        const recappedBySubject = getRecappedBySubject();

        // Group information
        let yPos = 55;
        recappedBySubject.forEach((group, groupIndex) => {
            if (groupIndex > 0) {
                doc.addPage();
                yPos = 15;

                // Repeat header on new page
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('LAPORAN PRESENSI SISWA', doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
                yPos += 10;
            }

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Kelas: ${group.class_name}`, 15, yPos);
            yPos += 6;
            doc.text(`Mata Pelajaran: ${group.subject_name}`, 15, yPos);
            yPos += 6;
            doc.text(`Tanggal: ${formatDate(group.presence_date)}`, 15, yPos);
            yPos += 10;

            // Generate table for each group
            const tableData = group.students.map((student, idx) => [
                idx + 1,
                student.nis,
                student.student_name,
                student.presence_status_name.charAt(0).toUpperCase() + student.presence_status_name.slice(1),
            ]);

            // Use autoTable function correctly
            autoTable(doc, {
                startY: yPos,
                head: [['No', 'NIS', 'Nama Siswa', 'Status Presensi']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246], textColor: 255 },
                styles: { overflow: 'linebreak', cellPadding: 3 },
                columnStyles: { 0: { cellWidth: 15 } },
            });

            // Get the final Y position after the table is drawn
            const finalY = doc.lastAutoTable.finalY;
            yPos = finalY + 10;

            // Add signature section
            const today = new Date();

            // Fix the date formatting - use proper date-fns format string
            // 'Purwokerto, d MMMM yyyy' has an unescaped 'r' which causes the error
            // Instead, use a literal string for 'Purwokerto,' followed by the date format
            const formattedDate = `Purwokerto, ${format(today, 'd MMMM yyyy', { locale: id })}`;

            doc.text(formattedDate, doc.internal.pageSize.getWidth() - 50, yPos);
            yPos += 6;
            doc.text('Guru Mata Pelajaran', doc.internal.pageSize.getWidth() - 50, yPos);
            yPos += 25;
            doc.text('___________________', doc.internal.pageSize.getWidth() - 50, yPos);
            yPos += 6;
            doc.text('NIP. _______________', doc.internal.pageSize.getWidth() - 50, yPos);
        });

        doc.save(`presensi_${selectedClass}_${selectedDate}.pdf`);
        toast.success('File PDF berhasil diunduh');
    };

    const handleExportCSV = () => {
        if (!recappedStudents.length) return;

        // Get recapped by subject
        const recappedBySubject = getRecappedBySubject();

        // Create proper CSV content with standard formatting
        let csvContent = 'data:text/csv;charset=utf-8,';

        // Add CSV headers (only once at the top)
        csvContent += 'Kelas,Mata Pelajaran,Tanggal,NIS,Nama Siswa,Status Presensi\r\n';

        // Add data rows for all students across all subjects
        recappedBySubject.forEach((group, index) => {
            // If this isn't the first group, add a blank line as subject separator
            if (index > 0) {
                csvContent += '\r\n';
            }

            const className = group.class_name;
            const subjectName = group.subject_name;
            const presenceDate = formatDate(group.presence_date);

            // Add each student as a row in the CSV
            group.students.forEach((student) => {
                const status = student.presence_status_name.charAt(0).toUpperCase() + student.presence_status_name.slice(1);
                csvContent += `"${className}","${subjectName}","${presenceDate}","${student.nis}","${student.student_name}","${status}"\r\n`;
            });
        });

        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `presensi_${selectedClass}_${selectedDate}.csv`);
        document.body.appendChild(link);

        // Trigger download
        link.click();
        document.body.removeChild(link);
        toast.success('File CSV berhasil diunduh');
    };

    // Check if current selection is today
    const isSelectedDateToday = isToday(parseISO(selectedDate));

    // Load data when selections change
    useEffect(() => {
        if (selectedClass && selectedDate) handleLoadPresenceData();
        else {
            setStudents([]);
            setRecappedStudents([]);
            setSelectedStudents([]);
        }
    }, [selectedClass, selectedDate, selectedSubject]);

    // Handle select all toggle
    useEffect(() => {
        if (selectAll && isSelectedDateToday) {
            const eligibleIds = students
                .filter((student) => student.recaps.length > 0 && !isStudentAlreadyRecapped(student.student_id, student.recaps[0].presence_date))
                .map((student) => student.recaps[0].id);
            setSelectedStudents(eligibleIds);
        } else setSelectedStudents([]);
    }, [selectAll]);

    const isStudentAlreadyRecapped = (studentId, presenceDate) => {
        return recappedStudents.some(
            (s) => s.student_id === studentId && s.presence_date === presenceDate && (selectedSubject ? s.subject_id === selectedSubject : true),
        );
    };

    // API calls
    const handleLoadPresenceData = async () => {
        if (!selectedClass || !selectedDate) return;
        setLoading(true);

        try {
            const [recappedRes, studentsRes] = await Promise.all([
                axios.post(route('staffteacher.presence-recap.get-recapped-students'), {
                    classId: selectedClass,
                    date: selectedDate,
                    subjectId: selectedSubject || undefined,
                }),
                // Only fetch students to recap if selected date is today
                isSelectedDateToday
                    ? axios.post(route('staffteacher.presence-recap.get-students'), {
                          classId: selectedClass,
                          date: selectedDate,
                      })
                    : Promise.resolve({ data: { students: [] } }),
            ]);

            const recappedWithDate =
                recappedRes.data.recappedStudents?.map((student) => ({
                    ...student,
                    presence_date: student.presence_date || selectedDate,
                })) || [];

            setRecappedStudents(recappedWithDate);

            const studentsWithDateInRecaps = studentsRes.data.students.map((student) => ({
                ...student,
                recaps: student.recaps.map((recap) => ({
                    ...recap,
                    presence_date: recap.presence_date || selectedDate,
                })),
            }));

            setStudents(studentsWithDateInRecaps);
            setSelectedStudents([]);
            setSelectAll(false);
            setCurrentPage(1);
            setCurrentStudentPage(1);
        } catch (error) {
            console.error('Error loading presence data:', error);
            toast.error('Gagal memuat data kehadiran siswa');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!isSelectedDateToday) {
            toast.error('Anda hanya dapat merekap presensi untuk hari ini');
            return;
        }
        if (!selectedSubject) {
            toast.error('Pilih mata pelajaran terlebih dahulu');
            return;
        }
        if (selectedStudents.length === 0) {
            toast.error('Pilih minimal satu siswa');
            return;
        }

        if (!window.confirm('Pastikan data yang Anda masukkan sudah benar. Lanjutkan?')) return;

        setIsSaving(true);
        try {
            await axios.post(route('staffteacher.presence-recap.store'), {
                subjectId: selectedSubject,
                presenceRecapIds: selectedStudents,
                date: selectedDate,
            });
            toast.success('Data presensi berhasil disimpan');
            await handleLoadPresenceData();
        } catch (error) {
            console.error('Error saving data:', error);
            if (error.response?.data?.message) {
                toast.error(`Gagal: ${error.response.data.message}`);
            } else if (error.response?.data?.errors) {
                Object.values(error.response.data.errors)
                    .flat()
                    .forEach((msg) => toast.error(msg));
            } else {
                toast.error('Gagal menyimpan data presensi');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!isSelectedDateToday) {
            toast.error('Anda hanya dapat mengelola presensi untuk hari ini');
            return;
        }
        if (!selectedClass || !selectedSubject || !selectedDate) {
            toast.error('Pilih kelas, mata pelajaran, dan tanggal terlebih dahulu');
            return;
        }

        if (!window.confirm('PERHATIAN! Anda akan menghapus SEMUA data presensi untuk kelas ini. Tindakan ini tidak dapat dibatalkan. Yakin?'))
            return;
        if (!window.confirm('Apakah Anda benar-benar yakin ingin menghapus data presensi ini?')) return;

        setIsDeleting(true);
        try {
            await axios.delete(route('staffteacher.presence-recap.delete'), {
                data: { subjectId: selectedSubject, classId: selectedClass, date: selectedDate },
            });
            toast.success('Data presensi berhasil dihapus');
            await handleLoadPresenceData();
        } catch (error) {
            console.error('Error deleting data:', error);
            toast.error(error.response?.data?.message || 'Gagal menghapus data presensi');
        } finally {
            setIsDeleting(false);
        }
    };

    // UI event handlers
    const handleStudentSelection = (recapId) => {
        if (!isSelectedDateToday) return;
        setSelectedStudents((prev) => (prev.includes(recapId) ? prev.filter((id) => id !== recapId) : [...prev, recapId]));
    };

    // Data processing
    const getRecappedBySubject = () => {
        const bySubject = {};
        recappedStudents.forEach((student) => {
            const key = `${student.subject_id}-${student.presence_date}`;
            if (!bySubject[key]) {
                bySubject[key] = {
                    subject_id: student.subject_id,
                    subject_name: student.subject_name,
                    class_id: student.class_id,
                    class_name: student.class_name,
                    presence_date: student.presence_date,
                    students: [],
                };
            }
            if (!bySubject[key].students.some((s) => s.student_id === student.student_id && s.presence_date === student.presence_date)) {
                bySubject[key].students.push(student);
            }
        });
        return Object.values(bySubject);
    };

    // Data for UI
    const recappedBySubject = getRecappedBySubject();
    const totalPages = Math.ceil(recappedBySubject.length / ITEMS_PER_PAGE);
    const currentRecapped = recappedBySubject.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const eligibleStudents = students.filter(
        (student) => student.recaps.length > 0 && !isStudentAlreadyRecapped(student.student_id, student.recaps[0].presence_date),
    );

    const paginateStudents = (students, page) => students.slice((page - 1) * STUDENTS_PER_PAGE, page * STUDENTS_PER_PAGE);

    // Render UI sections
    const renderPastDateWarning = () =>
        !isSelectedDateToday && (
            <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-900/20">
                <div className="flex items-center">
                    <LockIcon className="mr-2 h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        Anda hanya dapat melihat data untuk tanggal yang dipilih. Presensi hanya dapat dilakukan untuk hari ini (
                        {format(new Date(), 'dd MMMM yyyy', { locale: id })}).
                    </p>
                </div>
            </div>
        );

    const renderSelectionControls = () => (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
                {
                    label: 'Kelas',
                    component: (
                        <select
                            className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            value={selectedClass || ''}
                            onChange={(e) => setSelectedClass(Number(e.target.value) || null)}
                        >
                            <option value="">-- Pilih Kelas --</option>
                            {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.name}
                                </option>
                            ))}
                        </select>
                    ),
                    showChevron: true,
                },
                {
                    label: 'Tanggal',
                    component: (
                        <input
                            type="date"
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            max={format(new Date(), 'yyyy-MM-dd')} // Cannot select future dates
                        />
                    ),
                    showChevron: false,
                },
                {
                    label: 'Mata Pelajaran',
                    component: (
                        <select
                            className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            value={selectedSubject || ''}
                            onChange={(e) => setSelectedSubject(Number(e.target.value) || null)}
                        >
                            <option value="">-- Pilih Mata Pelajaran --</option>
                            {subjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.name}
                                </option>
                            ))}
                        </select>
                    ),
                    showChevron: true,
                },
            ].map(({ label, component, showChevron }) => (
                <div key={label}>
                    <label className="mb-1 block text-sm font-medium">{label}</label>
                    <div className="relative">
                        {component}
                        {showChevron && (
                            <ChevronDown className="pointer-events-none absolute top-2.5 right-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <AppLayoutStaffTeacher breadcrumbs={breadcrumbs}>
            <Head title="Rekap Presensi Siswa - Guru" />
            <motion.div className="flex min-h-screen" initial="hidden" animate="visible" variants={fadeIn}>
                <main className="min-h-screen flex-1 p-5">
                    <div className="relative mt-4 min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white p-6 text-gray-800 md:min-h-min dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                        <h2 className="text-xl font-bold">Input Data Presensi Mata Pelajaran</h2>
                        <p className="mt-2 mb-6 text-gray-500 dark:text-gray-400">Masukkan data presensi siswa untuk mata pelajaran Anda</p>

                        {renderSelectionControls()}
                        {renderPastDateWarning()}

                        {/* Action buttons - only show for today's date */}
                        {isSelectedDateToday && (
                            <div className="mb-6 flex flex-wrap gap-3">
                                <button
                                    onClick={handleSave}
                                    disabled={!selectedClass || !selectedSubject || !selectedDate || isSaving || selectedStudents.length === 0}
                                    className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    <span>{isSaving ? 'Menyimpan...' : 'Simpan Data'}</span>
                                </button>

                                <button
                                    onClick={handleDelete}
                                    disabled={!selectedClass || !selectedSubject || !selectedDate || isDeleting}
                                    className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    <span>{isDeleting ? 'Menghapus...' : 'Hapus Semua Data'}</span>
                                </button>
                            </div>
                        )}

                        {loading ? (
                            <LoadingState />
                        ) : (
                            <>
                                {selectedClass && selectedDate ? (
                                    <>
                                        <div className="mb-4 rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
                                            <p className="text-blue-800 dark:text-blue-200">
                                                Menampilkan data presensi untuk kelas{' '}
                                                <strong>{classes.find((c) => c.id === selectedClass)?.name}</strong> pada tanggal{' '}
                                                <strong>{formatDate(selectedDate)}</strong>
                                            </p>
                                        </div>

                                        {/* Show eligible students only if date is today */}
                                        {isSelectedDateToday && eligibleStudents.length > 0 && (
                                            <div className="mb-6">
                                                <h3 className="mb-3 text-lg font-semibold">Siswa Yang Dapat Direkap</h3>
                                                <div className="mb-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            id="select-all"
                                                            checked={selectAll}
                                                            onChange={(e) => setSelectAll(e.target.checked)}
                                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <label htmlFor="select-all" className="text-sm font-medium">
                                                            Pilih Semua
                                                        </label>
                                                    </div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        {selectedStudents.length} dari {eligibleStudents.length} siswa dipilih
                                                    </div>
                                                </div>
                                                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                        <thead className="bg-gray-50 dark:bg-gray-800">
                                                            <tr>
                                                                {['Pilih', 'NIS', 'Nama Siswa', 'Status Presensi'].map((header) => (
                                                                    <th
                                                                        key={header}
                                                                        className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                                                    >
                                                                        {header}
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                                            {eligibleStudents.map((student) => {
                                                                const recapId = student.recaps[0].id;
                                                                const statusValue = student.recaps[0].presence_status_name;
                                                                return (
                                                                    <tr
                                                                        key={student.student_id}
                                                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                                                    >
                                                                        <td className="px-3 py-4 text-sm whitespace-nowrap">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={selectedStudents.includes(recapId)}
                                                                                onChange={() => handleStudentSelection(recapId)}
                                                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                            />
                                                                        </td>
                                                                        <td className="px-3 py-4 text-sm whitespace-nowrap">{student.nis}</td>
                                                                        <td className="px-3 py-4 text-sm font-medium whitespace-nowrap">
                                                                            {student.student_name}
                                                                        </td>
                                                                        <td className="px-3 py-4 text-sm whitespace-nowrap">
                                                                            <span
                                                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusClass(statusValue)}`}
                                                                            >
                                                                                {formatStatus(statusValue || '')}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {!isSelectedDateToday && !recappedStudents.length && (
                                            <EmptyState
                                                icon={AlertCircle}
                                                title="Tidak ada data"
                                                description="Tidak ada data presensi siswa untuk kelas dan tanggal yang dipilih"
                                            />
                                        )}

                                        {/* Display recapped students regardless of date */}
                                        {recappedStudents.length > 0 && (
                                            <div className="mt-8">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <h3 className="text-lg font-semibold">Siswa Yang Sudah Direkap</h3>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleExportPDF()}
                                                            className="flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                                                            disabled={!recappedStudents.length}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                            Export PDF
                                                        </button>
                                                        <button
                                                            onClick={() => handleExportCSV()}
                                                            className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                                                            disabled={!recappedStudents.length}
                                                        >
                                                            <FileSpreadsheet className="h-4 w-4" />
                                                            Export CSV
                                                        </button>
                                                    </div>
                                                </div>
                                                {currentRecapped.map((subjectGroup, groupIndex) => {
                                                    const displayStudents = paginateStudents(subjectGroup.students, currentStudentPage);
                                                    const totalStudentPages = Math.ceil(subjectGroup.students.length / STUDENTS_PER_PAGE);
                                                    return (
                                                        <div key={`${subjectGroup.subject_id}-${groupIndex}`} className="mb-6">
                                                            <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row">
                                                                <div>
                                                                    <div className="flex">
                                                                        <span className="w-32 font-medium">Kelas</span>:{' '}
                                                                        <span className="ml-2 font-semibold">{subjectGroup.class_name}</span>
                                                                    </div>
                                                                    <div className="flex">
                                                                        <span className="w-32 font-medium">Mata Pelajaran</span>:{' '}
                                                                        <span className="ml-2 font-semibold">{subjectGroup.subject_name}</span>
                                                                    </div>
                                                                    <div className="flex">
                                                                        <span className="w-32 font-medium">Tanggal Presensi</span>:{' '}
                                                                        <span className="ml-2 font-semibold">
                                                                            {formatDate(subjectGroup.presence_date)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    Total: {subjectGroup.students.length} siswa
                                                                </div>
                                                            </div>
                                                            <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm dark:border-gray-700">
                                                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                                                        <tr>
                                                                            {['NIS', 'Nama Siswa', 'Status Presensi'].map((header) => (
                                                                                <th
                                                                                    key={header}
                                                                                    className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                                                                >
                                                                                    {header}
                                                                                </th>
                                                                            ))}
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                                                        {displayStudents.map((student, index) => (
                                                                            <tr
                                                                                key={`${student.student_id}-${index}`}
                                                                                className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                                                            >
                                                                                <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                                                                                    {student.nis}
                                                                                </td>
                                                                                <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                                                                                    {student.student_name}
                                                                                </td>
                                                                                <td className="px-4 py-4 text-sm whitespace-nowrap">
                                                                                    <span
                                                                                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(student.presence_status_name)}`}
                                                                                    >
                                                                                        {formatStatus(student.presence_status_name)}
                                                                                    </span>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                            <Pagination
                                                                currentPage={currentStudentPage}
                                                                totalPages={totalStudentPages}
                                                                setCurrentPage={setCurrentStudentPage}
                                                                size="sm"
                                                            />
                                                        </div>
                                                    );
                                                })}
                                                <Pagination currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} />
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <EmptyState
                                        icon={Calendar}
                                        title="Pilih kelas dan tanggal"
                                        description="Silakan pilih kelas dan tanggal untuk menampilkan data presensi siswa"
                                    />
                                )}
                            </>
                        )}
                    </div>
                </main>
            </motion.div>
        </AppLayoutStaffTeacher>
    );
}
