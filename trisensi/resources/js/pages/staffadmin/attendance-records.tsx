import React, { useState, useEffect } from 'react';
import AppLayoutStaffAdmin from '@/layouts/staffadmin/app-layout-staffadmin';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { QrCode, Search, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard Staff Admin',
        href: '/staffadmin/dashboard',
    },
    {
        title: 'Rekap Kehadiran',
        href: '/staffadmin/attendance-records',
    },
];

interface PresenceRecord {
    id: number;
    student_name: string;
    status: string;
    status_name: string;
    timestamp: string;
    batch: string; // Angkatan
    class_name: string; // Kelas
    semester: string; // Semester
}

interface ClassGroup {
    class_name: string;
    batch: string;
    semester: string;
    students: PresenceRecord[];
    expanded: boolean;
}

interface Props {
    records: PresenceRecord[];
}

export default function AttendanceRecords({ records }: Props) {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterClass, setFilterClass] = useState<string>('all');
    const [filterBatch, setFilterBatch] = useState<string>('all');
    const [filterSemester, setFilterSemester] = useState<string>('all');
    const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});
    const [expandedNames, setExpandedNames] = useState<Record<number, boolean>>({});
    const [expansionTimers, setExpansionTimers] = useState<Record<number, NodeJS.Timeout>>({});
    
    // Pagination untuk siswa dalam card
    const [groupPagination, setGroupPagination] = useState<Record<number, number>>({});
    const studentsPerPage = 10;
    
    // Pagination untuk card
    const [currentPage, setCurrentPage] = useState<number>(0);
    const cardsPerPage = 9; // 3x3 grid
   
    // Extract unique values for filtering
    const uniqueClasses = [...new Set(records.map(record => record.class_name))];
    const uniqueBatches = [...new Set(records.map(record => record.batch))];
    const uniqueSemesters = [...new Set(records.map(record => record.semester))];
   
    // Clear timers on component unmount
    useEffect(() => {
        return () => {
            // Clean up all timers when component unmounts
            Object.values(expansionTimers).forEach(timer => clearTimeout(timer));
        };
    }, [expansionTimers]);

    // Filter records based on search query and all filters
    const filteredRecords = records.filter(record => {
        const matchesSearch = record.student_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
        const matchesClass = filterClass === 'all' || record.class_name === filterClass;
        const matchesBatch = filterBatch === 'all' || record.batch === filterBatch;
        const matchesSemester = filterSemester === 'all' || record.semester === filterSemester;
       
        return matchesSearch && matchesStatus && matchesClass && matchesBatch && matchesSemester;
    });

    // Group filtered records by class, batch, and semester
    const groupedRecords: ClassGroup[] = [];
    
    filteredRecords.forEach(record => {
        const key = `${record.class_name}_${record.batch}_${record.semester}`;
        let group = groupedRecords.find(g => 
            g.class_name === record.class_name && 
            g.batch === record.batch && 
            g.semester === record.semester
        );
        
        if (!group) {
            group = {
                class_name: record.class_name,
                batch: record.batch,
                semester: record.semester,
                students: [],
                expanded: !!expandedGroups[groupedRecords.length]
            };
            groupedRecords.push(group);
        }
        
        group.students.push(record);
    });
    
    // Sort groups by class name, batch, and semester for consistent display
    groupedRecords.sort((a, b) => {
        if (a.class_name !== b.class_name) return a.class_name.localeCompare(b.class_name);
        if (a.batch !== b.batch) return a.batch.localeCompare(b.batch);
        return a.semester.localeCompare(b.semester);
    });
    
    // Pagination for cards
    const totalPages = Math.ceil(groupedRecords.length / cardsPerPage);
    const paginatedGroups = groupedRecords.slice(
        currentPage * cardsPerPage, 
        (currentPage + 1) * cardsPerPage
    );
    
    // Function to toggle expanded state for a class group
    const toggleExpand = (index: number) => {
        setExpandedGroups(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };
    
    // Function to toggle nama panjang display
    const toggleNameExpansion = (studentId: number) => {
        // Clear previous timer if exists
        if (expansionTimers[studentId]) {
            clearTimeout(expansionTimers[studentId]);
        }

        setExpandedNames(prev => ({
            ...prev,
            [studentId]: !prev[studentId]
        }));
        
        // If we're expanding, set a timer to auto-collapse
        if (!expandedNames[studentId]) {
            const timer = setTimeout(() => {
                setExpandedNames(current => ({
                    ...current,
                    [studentId]: false
                }));
                
                // Remove the timer reference
                setExpansionTimers(current => {
                    const updated = { ...current };
                    delete updated[studentId];
                    return updated;
                });
            }, 5000);
            
            // Store the timer reference
            setExpansionTimers(current => ({
                ...current,
                [studentId]: timer
            }));
        }
    };
    
    // Handle single click
    const handleNameClick = (studentId: number) => {
        toggleNameExpansion(studentId);
    };

    // Handle pagination for students within a card
    const handleNextStudentsPage = (groupIndex: number) => {
        const currentStudentsPage = groupPagination[groupIndex] || 0;
        const totalStudentsPages = Math.ceil(groupedRecords[groupIndex].students.length / studentsPerPage);
        
        if (currentStudentsPage < totalStudentsPages - 1) {
            setGroupPagination(prev => ({
                ...prev,
                [groupIndex]: currentStudentsPage + 1
            }));
        }
    };

    const handlePrevStudentsPage = (groupIndex: number) => {
        const currentStudentsPage = groupPagination[groupIndex] || 0;
        
        if (currentStudentsPage > 0) {
            setGroupPagination(prev => ({
                ...prev,
                [groupIndex]: currentStudentsPage - 1
            }));
        }
    };

    // Handle pagination for cards
    const handleNextCardsPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
            // Reset group pagination when changing card page
            setGroupPagination({});
        }
    };

    const handlePrevCardsPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
            // Reset group pagination when changing card page
            setGroupPagination({});
        }
    };

    // Get paginated students for a group
    const getPaginatedStudents = (group: ClassGroup, groupIndex: number) => {
        const currentStudentsPage = groupPagination[groupIndex] || 0;
        const startIndex = currentStudentsPage * studentsPerPage;
        return group.students.slice(startIndex, startIndex + studentsPerPage);
    };

    // Format timestamp to a readable date and time in WIB timezone
    const formatDateTime = (timestamp: string) => {
        // Parsing timestamp asli
        const originalDate = new Date(timestamp);
       
        // Membuat formatter untuk waktu Indonesia (WIB)
        const formatter = new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
       
        // Mendapatkan waktu dalam milidetik
        const originalTime = originalDate.getTime();
       
        // Menambahkan 7 jam (dalam milidetik)
        const wibTime = originalTime + (7 * 60 * 60 * 1000);
       
        // Membuat tanggal baru dengan waktu yang sudah disesuaikan
        const adjustedDate = new Date(wibTime);
       
        // Memformat tanggal dan waktu
        const formattedDateTime = formatter.format(adjustedDate);
       
        // Menambahkan label WIB
        return formattedDateTime.replace(',', '') + ' WIB';
    };

    // Get status style based on status value
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'present':
                return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
            case 'absent':
                return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
            case 'late':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
        }
    };

    // Check if a name is too long and should be truncatable
    const isLongName = (name: string) => name.length > 20;

    // Get the index for a class group relative to the entire dataset
    const getGlobalGroupIndex = (localIndex: number) => {
        return currentPage * cardsPerPage + localIndex;
    };

    return (
        <AppLayoutStaffAdmin breadcrumbs={breadcrumbs}>
            <Head title="Rekap Kehadiran - Tata Usaha" />
            <div className="flex">
                <main className="min-h-screen flex-1 p-5">
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative mt-4 min-h-[70vh] flex-1 overflow-hidden rounded-xl border bg-white p-6 text-gray-800 dark:bg-gray-900 dark:text-white md:min-h-min">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                            <h2 className="text-2xl font-bold mb-4 sm:mb-0">Rekap Kehadiran Siswa</h2>
                           
                            <Link
                                href="/staffadmin/scan-qr-attendance"
                                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm"
                            >
                                <QrCode className="w-5 h-5 mr-2" />
                                Scan QR Presensi
                            </Link>
                        </div>
                       
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <Search className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                    placeholder="Cari berdasarkan nama siswa..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                           
                            <div className="relative w-full md:w-48">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <Filter className="w-5 h-5 text-gray-400" />
                                </div>
                                <select
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="present">Hadir</option>
                                    <option value="absent">Tidak Hadir</option>
                                    <option value="late">Terlambat</option>
                                </select>
                            </div>
                        </div>
                       
                        {/* Additional Filters */}
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            {/* Batch/Angkatan Filter */}
                            <div className="relative w-full md:w-1/3">
                                <select
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                    value={filterBatch}
                                    onChange={(e) => setFilterBatch(e.target.value)}
                                >
                                    <option value="all">Semua Angkatan</option>
                                    {uniqueBatches.map((batch) => (
                                        <option key={batch} value={batch}>
                                            Angkatan {batch}
                                        </option>
                                    ))}
                                </select>
                            </div>
                           
                            {/* Class Filter */}
                            <div className="relative w-full md:w-1/3">
                                <select
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                    value={filterClass}
                                    onChange={(e) => setFilterClass(e.target.value)}
                                >
                                    <option value="all">Semua Kelas</option>
                                    {uniqueClasses.map((className) => (
                                        <option key={className} value={className}>
                                            {className}
                                        </option>
                                    ))}
                                </select>
                            </div>
                           
                            {/* Semester Filter */}
                            <div className="relative w-full md:w-1/3">
                                <select
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                    value={filterSemester}
                                    onChange={(e) => setFilterSemester(e.target.value)}
                                >
                                    <option value="all">Semua Semester</option>
                                    {uniqueSemesters.map((semester) => (
                                        <option key={semester} value={semester}>
                                            Semester {semester}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        {/* Group Cards */}
                        {groupedRecords.length === 0 ? (
                            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                                Tidak ada data kehadiran
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {paginatedGroups.map((group, localIndex) => {
                                        const globalGroupIndex = getGlobalGroupIndex(localIndex);
                                        const currentStudentsPage = groupPagination[globalGroupIndex] || 0;
                                        const totalStudents = group.students.length;
                                        const totalStudentsPages = Math.ceil(totalStudents / studentsPerPage);
                                        const displayStudents = getPaginatedStudents(group, globalGroupIndex);
                                        
                                        // Calculate page stats for students
                                        const startItem = currentStudentsPage * studentsPerPage + 1;
                                        const endItem = Math.min((currentStudentsPage + 1) * studentsPerPage, totalStudents);
                                        
                                        return (
                                            <div 
                                                key={globalGroupIndex} 
                                                className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden"
                                            >
                                                {/* Card Header */}
                                                <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <h3 className="text-lg font-semibold">
                                                            Kelas {group.class_name}
                                                        </h3>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                            {group.students.length} siswa
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded-full">
                                                            Angkatan {group.batch}
                                                        </span>
                                                        <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 rounded-full">
                                                            Semester {group.semester}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {/* Card Content dengan Grid Layout */}
                                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                                    {/* Header row */}
                                                    <div className="grid grid-cols-12 p-3 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400">
                                                        <div className="col-span-5">Nama Siswa</div>
                                                        <div className="col-span-3 text-center">Status</div>
                                                        <div className="col-span-4 text-right">Waktu</div>
                                                    </div>
                                                    
                                                    {displayStudents.map((student) => (
                                                        <div 
                                                            key={student.id} 
                                                            className="grid grid-cols-12 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 items-center"
                                                        >
                                                            {/* Kolom Nama Siswa */}
                                                            <div className="col-span-5 relative group">
                                                                {isLongName(student.student_name) ? (
                                                                    <>
                                                                        <div 
                                                                            className={`font-medium text-gray-900 dark:text-white ${expandedNames[student.id] ? '' : 'truncate'} cursor-pointer hover:text-blue-600 dark:hover:text-blue-400`}
                                                                            title="Klik untuk melihat nama lengkap" 
                                                                            onClick={() => handleNameClick(student.id)}
                                                                            style={{ cursor: 'pointer' }}
                                                                        >
                                                                            {student.student_name}
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                                        {student.student_name}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            
                                                            {/* Kolom Status */}
                                                            <div className="col-span-3 text-center">
                                                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusStyle(student.status)}`}>
                                                                    {student.status_name}
                                                                </span>
                                                            </div>
                                                            
                                                            {/* Kolom Waktu */}
                                                            <div className="col-span-4 text-right text-sm text-gray-500 dark:text-gray-400">
                                                                {formatDateTime(student.timestamp)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    
                                                    {/* Pagination Controls for Students */}
                                                    {totalStudentsPages > 1 && (
                                                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {startItem}-{endItem} dari {totalStudents}
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <button
                                                                    onClick={() => handlePrevStudentsPage(globalGroupIndex)}
                                                                    disabled={currentStudentsPage === 0}
                                                                    className={`p-1 rounded-md ${
                                                                        currentStudentsPage === 0 
                                                                            ? 'text-gray-400 cursor-not-allowed' 
                                                                            : 'text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900'
                                                                    }`}
                                                                    aria-label="Previous page"
                                                                >
                                                                    <ChevronLeft className="w-5 h-5" />
                                                                </button>
                                                                
                                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                                    {currentStudentsPage + 1} / {totalStudentsPages}
                                                                </span>
                                                                
                                                                <button
                                                                    onClick={() => handleNextStudentsPage(globalGroupIndex)}
                                                                    disabled={currentStudentsPage >= totalStudentsPages - 1}
                                                                    className={`p-1 rounded-md ${
                                                                        currentStudentsPage >= totalStudentsPages - 1
                                                                            ? 'text-gray-400 cursor-not-allowed' 
                                                                            : 'text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900'
                                                                    }`}
                                                                    aria-label="Next page"
                                                                >
                                                                    <ChevronRight className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {/* Main Pagination Controls (for cards) */}
                                {totalPages > 1 && (
                                    <div className="mt-8 flex justify-center">
                                        <div className="flex items-center justify-center bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center space-x-4">
                                                <button
                                                    onClick={handlePrevCardsPage}
                                                    disabled={currentPage === 0}
                                                    className={`flex items-center px-3 py-1 rounded-md ${
                                                        currentPage === 0 
                                                            ? 'text-gray-400 cursor-not-allowed' 
                                                            : 'text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900'
                                                    }`}
                                                    aria-label="Previous page"
                                                >
                                                    <ChevronLeft className="w-5 h-5 mr-1" />
                                                    <span>Sebelumnya</span>
                                                </button>
                                                
                                                <div className="text-sm flex items-center">
                                                    <span className="text-gray-700 dark:text-gray-300">
                                                        Halaman <span className="font-medium">{currentPage + 1}</span> dari <span className="font-medium">{totalPages}</span>
                                                    </span>
                                                </div>
                                                
                                                <button
                                                    onClick={handleNextCardsPage}
                                                    disabled={currentPage >= totalPages - 1}
                                                    className={`flex items-center px-3 py-1 rounded-md ${
                                                        currentPage >= totalPages - 1
                                                            ? 'text-gray-400 cursor-not-allowed' 
                                                            : 'text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900'
                                                    }`}
                                                    aria-label="Next page"
                                                >
                                                    <span>Selanjutnya</span>
                                                    <ChevronRight className="w-5 h-5 ml-1" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Summary text showing total cards */}
                                <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                    Menampilkan {paginatedGroups.length} dari {groupedRecords.length} kelas
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </AppLayoutStaffAdmin>
    );
}
