import AppLayoutStaffAdmin from '@/layouts/staffadmin/app-layout-staffadmin';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowDownToLine, BarChart, Calendar, ChevronLeft, ChevronRight, Filter, Grid, List, QrCode, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';

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
    batch: string | number;
    class_name: string;
    semester: string;
    student_id?: number;
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
    batches?: string[];
}

export default function AttendanceRecords({ records, batches = [] }: Props) {
    // Original state
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterClass, setFilterClass] = useState<string>('all');
    const [filterBatch, setFilterBatch] = useState<string>('all');
    const [filterSemester, setFilterSemester] = useState<string>('all');
    const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});
    const [expandedNames, setExpandedNames] = useState<Record<number, boolean>>({});
    const [expansionTimers, setExpansionTimers] = useState<Record<number, NodeJS.Timeout>>({});
    const [groupPagination, setGroupPagination] = useState<Record<number, number>>({});
    const [currentPage, setCurrentPage] = useState<number>(0);

    // New state variables
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]); // Single date for filtering
    const [showStatistics, setShowStatistics] = useState<boolean>(true);

    // Constants
    const studentsPerPage = 10;
    const cardsPerPage = 9; // 3x3 grid
    const tableRowsPerPage = 20;

    // Pagination for table view
    const [tableCurrentPage, setTableCurrentPage] = useState<number>(0);

    // Extract unique values for filtering
    const uniqueClasses = [...new Set(records.map((record) => record.class_name))];

    // Get unique batches directly from the props if available, otherwise extract from records
    const uniqueBatches = batches.length > 0 ? batches : [...new Set(records.map((record) => String(record.batch)))];

    const uniqueSemesters = [...new Set(records.map((record) => record.semester))];

    // Convert UTC To WIB
    const convertUTCToWIBDateOnly = (timestamp: string) => {
        const utcDate = new Date(timestamp);
        const wibTime = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);
        return wibTime.toISOString().split('T')[0];
    };

    // Calculate date range for filtering
    const filterByDate = (record: PresenceRecord) => {
        const recordDateWIB = convertUTCToWIBDateOnly(record.timestamp);
        return recordDateWIB === selectedDate;
    };

    // Handle date change
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        setSelectedDate(newDate);

        router.get(
            route('staffadmin.attendance.get-recaps'),
            {
                date: newDate,
            },
            {
                preserveState: true,
                onSuccess: (page) => {
                    if (page.props?.recaps) {
                        console.log('Data kehadiran berhasil diambil:', page.props.recaps.length, 'data');
                        // Update state jika perlu
                    }
                },
            },
        );
    };

    // Filter records based on all filters including date
    const filteredRecords = records.filter((record) => {
        const matchesSearch = record.student_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
        const matchesClass = filterClass === 'all' || record.class_name === filterClass;

        // Perbaikan untuk filter batch
        const recordBatch = String(record.batch).trim();
        const selectedBatch = String(filterBatch).trim();
        const matchesBatch = filterBatch === 'all' || recordBatch === selectedBatch;

        // Debugging untuk batch filtering
        if (filterBatch !== 'all' && recordBatch === selectedBatch) {
            console.log(`Match found: record batch "${recordBatch}" matches filter "${selectedBatch}"`);
        }

        const matchesSemester = filterSemester === 'all' || record.semester === filterSemester;
        const matchesDate = filterByDate(record);

        return matchesSearch && matchesStatus && matchesClass && matchesBatch && matchesSemester && matchesDate;
    });

    // Group filtered records by class, batch, and semester
    const groupedRecords: ClassGroup[] = [];

    filteredRecords.forEach((record) => {
        const key = `${record.class_name}_${record.batch}_${record.semester}`;
        let group = groupedRecords.find(
            (g) => g.class_name === record.class_name && String(g.batch) === String(record.batch) && g.semester === record.semester,
        );

        if (!group) {
            group = {
                class_name: record.class_name,
                batch: String(record.batch), // Ensure batch is stored as string
                semester: record.semester,
                students: [],
                expanded: !!expandedGroups[groupedRecords.length],
            };
            groupedRecords.push(group);
        }

        group.students.push(record);
    });

    // Sort groups - FIX: Convert batch values to strings before comparing
    groupedRecords.sort((a, b) => {
        if (a.class_name !== b.class_name) return a.class_name.localeCompare(b.class_name);
        // Ensure we're comparing strings for batch values
        if (a.batch !== b.batch) return String(a.batch).localeCompare(String(b.batch));
        return a.semester.localeCompare(b.semester);
    });

    // Calculate statistics
    const statistics = {
        total: filteredRecords.length,
        present: filteredRecords.filter((r) => r.status === 'present').length,
        absent: filteredRecords.filter((r) => r.status === 'absent').length,
        late: filteredRecords.filter((r) => r.status === 'late').length,
    };

    // Calculate percentages
    const percentages = {
        present: statistics.total > 0 ? Math.round((statistics.present / statistics.total) * 100) : 0,
        absent: statistics.total > 0 ? Math.round((statistics.absent / statistics.total) * 100) : 0,
        late: statistics.total > 0 ? Math.round((statistics.late / statistics.total) * 100) : 0,
    };

    // Pagination for cards
    const totalPages = Math.ceil(groupedRecords.length / cardsPerPage);
    const paginatedGroups = groupedRecords.slice(currentPage * cardsPerPage, (currentPage + 1) * cardsPerPage);

    // Pagination for table view
    const totalTablePages = Math.ceil(filteredRecords.length / tableRowsPerPage);
    const paginatedTableRecords = filteredRecords.slice(tableCurrentPage * tableRowsPerPage, (tableCurrentPage + 1) * tableRowsPerPage);

    // Tambahkan debugging output setiap kali filter berubah
    useEffect(() => {
        console.log('Current Filter Batch:', filterBatch);
        console.log('Available Batches:', uniqueBatches);
        console.log('Records before filtering:', records.length);
        console.log('Filtered Records:', filteredRecords.length);

        // Log beberapa sampel data batch dari records asli untuk verifikasi
        const sampleBatches = records.slice(0, 5).map((r) => ({
            id: r.id,
            student: r.student_name,
            batch: r.batch,
            batchType: typeof r.batch,
        }));
        console.log('Sample Batch Data:', sampleBatches);
    }, [filterBatch, filteredRecords.length, records.length]);

    // Function to toggle expanded state for a class group
    const toggleExpand = (index: number) => {
        setExpandedGroups((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    // Function to toggle nama panjang display
    const toggleNameExpansion = (studentId: number) => {
        // Clear previous timer if exists
        if (expansionTimers[studentId]) {
            clearTimeout(expansionTimers[studentId]);
        }

        setExpandedNames((prev) => ({
            ...prev,
            [studentId]: !prev[studentId],
        }));

        // If we're expanding, set a timer to auto-collapse
        if (!expandedNames[studentId]) {
            const timer = setTimeout(() => {
                setExpandedNames((current) => ({
                    ...current,
                    [studentId]: false,
                }));

                // Remove the timer reference
                setExpansionTimers((current) => {
                    const updated = { ...current };
                    delete updated[studentId];
                    return updated;
                });
            }, 5000);

            // Store the timer reference
            setExpansionTimers((current) => ({
                ...current,
                [studentId]: timer,
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
            setGroupPagination((prev) => ({
                ...prev,
                [groupIndex]: currentStudentsPage + 1,
            }));
        }
    };

    const handlePrevStudentsPage = (groupIndex: number) => {
        const currentStudentsPage = groupPagination[groupIndex] || 0;

        if (currentStudentsPage > 0) {
            setGroupPagination((prev) => ({
                ...prev,
                [groupIndex]: currentStudentsPage - 1,
            }));
        }
    };

    // Handle pagination for cards
    const handleNextCardsPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
            setGroupPagination({});
        }
    };

    const handlePrevCardsPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
            setGroupPagination({});
        }
    };

    // Handle pagination for table
    const handleNextTablePage = () => {
        if (tableCurrentPage < totalTablePages - 1) {
            setTableCurrentPage(tableCurrentPage + 1);
        }
    };

    const handlePrevTablePage = () => {
        if (tableCurrentPage > 0) {
            setTableCurrentPage(tableCurrentPage - 1);
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
        const originalDate = new Date(timestamp);

        const formatter = new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });

        const originalTime = originalDate.getTime();
        const wibTime = originalTime + 7 * 60 * 60 * 1000;
        const adjustedDate = new Date(wibTime);
        const formattedDateTime = formatter.format(adjustedDate);

        return formattedDateTime.replace(',', '') + ' WIB';
    };

    // Format date only
    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
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

    // Fungsi tunggal untuk proses absensi otomatis dengan kemampuan scheduler yang hanya aktif untuk staff admin
    const processAutomaticAbsence = (() => {
        // Variabel private untuk menyimpan timer dan status
        let scheduler = null;
        let isRunning = false;
        let lastRunTimestamp = 0;
        let initialized = false; // Flag untuk menandai sudah diinisialisasi

        const INTERVAL_MINUTES = 1;
        const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;
        const STORAGE_KEY_PREFIX = 'staffadmin_absence_';
        const DEBOUNCE_TIME = 300; // Debounce time untuk mencegah multiple invoke
        let initDebounceTimer = null;

        // Fungsi helper untuk mendapatkan waktu WIB (UTC+7)
        const getWIBTime = (date = new Date()) => {
            const hours = date.getHours();
            const minutes = date.getMinutes();
            return { hours, minutes, inOperationalHours: hours >= 5 && hours < 18 };
        };

        // Fungsi yang lebih robust untuk memeriksa apakah pengguna adalah staff admin
        const isStaffAdmin = () => {
            // Gunakan caching untuk performa
            if (window._isAdminCached !== undefined) return window._isAdminCached;

            // Metode deteksi yang lebih komprehensif
            const isStaffAdminPath = /\/staffadmin(\/|$)/.test(window.location.pathname);
            const hasStaffAdminToken = document.cookie.includes('staffadmin_session') || localStorage.getItem('staffadmin_auth') !== null;
            const hasStaffAdminElements =
                document.body.classList.contains('staff-admin') ||
                !!document.getElementById('staff-admin-panel') ||
                !!document.querySelector('.staffadmin-header') ||
                !!document.querySelector('[data-staffadmin-role]');
            const hasStaffAdminGlobalVar = window.isStaffAdmin === true || (window.APP_DATA && window.APP_DATA.userRole === 'staffadmin');

            // Cache hasil untuk mengurangi komputasi berlebihan
            window._isAdminCached = isStaffAdminPath || hasStaffAdminElements || hasStaffAdminGlobalVar || hasStaffAdminToken;
            return window._isAdminCached;
        };

        // Fungsi untuk menjalankan proses absensi
        const executeProcess = (isAuto = false) => {
            if (!isStaffAdmin()) {
                console.log('Proses absensi otomatis diabaikan: Pengguna bukan staff admin');
                return;
            }

            // Untuk proses otomatis, cek apakah sudah waktunya untuk menjalankan
            if (isAuto) {
                const now = Date.now();
                if (now - lastRunTimestamp < INTERVAL_MS) {
                    console.log(
                        'Proses absensi diabaikan: Terlalu cepat sejak proses terakhir:',
                        Math.floor((now - lastRunTimestamp) / 1000),
                        'detik',
                    );
                    return;
                }
                lastRunTimestamp = now;
                localStorage.setItem(`${STORAGE_KEY_PREFIX}lastRun`, lastRunTimestamp.toString());
            }

            // Periksa apakah route function tersedia secara lebih komprehensif
            const routeExists = typeof route === 'function' && typeof router === 'object';
            const alternateRouterExists =
                typeof window.axios !== 'undefined' ||
                typeof window.fetch !== 'undefined' ||
                (typeof $ !== 'undefined' && typeof $.ajax === 'function');

            if (!routeExists && !alternateRouterExists) {
                console.log('Proses absensi otomatis diabaikan: Route function tidak tersedia');
                return;
            }

            // Cek elemen loading dan tombol proses secara dinamis
            const loadingElement = document.getElementById('loading-indicator') || document.querySelector('.loading-indicator');
            const processButton = document.getElementById('process-auto-button') || document.querySelector('.process-auto-button');

            if (loadingElement) loadingElement.style.display = 'block';
            if (processButton) processButton.disabled = true;

            if (isAuto) {
                const { hours, minutes } = getWIBTime();
                console.log(`Menjalankan proses absensi otomatis pada ${hours}:${minutes.toString().padStart(2, '0')} WIB`);
            }

            try {
                // Gunakan router yang tersedia
                if (routeExists) {
                    router.post(
                        route('staffadmin.attendance.process-automatic-absence'),
                        {},
                        {
                            onSuccess: handleSuccess,
                            onError: handleError,
                        },
                    );
                } else if (typeof window.axios !== 'undefined') {
                    window.axios
                        .post('/staffadmin/attendance/process-automatic-absence')
                        .then((response) => handleSuccess(response))
                        .catch((error) => handleError(error.response?.data || error));
                } else if (typeof window.fetch !== 'undefined') {
                    window
                        .fetch('/staffadmin/attendance/process-automatic-absence', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                            },
                            credentials: 'same-origin',
                        })
                        .then((response) => response.json())
                        .then((data) => handleSuccess({ props: { flash: data } }))
                        .catch((error) => handleError({ message: error.message }));
                } else if (typeof $ !== 'undefined' && typeof $.ajax === 'function') {
                    $.ajax({
                        url: '/staffadmin/attendance/process-automatic-absence',
                        type: 'POST',
                        dataType: 'json',
                        headers: {
                            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content') || '',
                        },
                        success: (data) => handleSuccess({ props: { flash: data } }),
                        error: (error) => handleError({ message: error.responseJSON?.message || error.statusText }),
                    });
                }
            } catch (err) {
                console.error('Tidak dapat menjalankan proses absensi otomatis:', err);
                if (loadingElement) loadingElement.style.display = 'none';
                if (processButton) processButton.disabled = false;
            }

            // Fungsi handler untuk respons sukses
            function handleSuccess(response) {
                if (loadingElement) loadingElement.style.display = 'none';
                if (processButton) processButton.disabled = false;

                const data = response.props?.flash || {};
                const resultMessage =
                    data.message + (data.processed_count ? `\n${data.processed_count} siswa telah ditandai Alfa pada ${data.date}` : '');

                if (data.success) {
                    if (isAuto) {
                        console.log('[AUTO] ' + resultMessage);
                    } else {
                        alert(resultMessage);
                    }
                    if (typeof refreshAttendanceData === 'function') {
                        refreshAttendanceData();
                    }
                } else {
                    if (isAuto) {
                        console.log('[AUTO] ' + (data.message || 'Proses absensi otomatis selesai'));
                    } else {
                        alert(data.message || 'Proses absensi otomatis selesai');
                    }
                }
            }

            // Fungsi handler untuk error
            function handleError(errors) {
                if (loadingElement) loadingElement.style.display = 'none';
                if (processButton) processButton.disabled = false;

                const errorMessage =
                    errors.message ||
                    'Terjadi kesalahan saat memproses absensi otomatis atau mungkin hari ini adalah hari diluar hari sekolah mungkin kami tidak bisa memproses presensi otomatis';
                if (isAuto) {
                    console.error('[AUTO] Error:', errorMessage);
                } else {
                    alert('Error: ' + errorMessage);
                }
            }
        };

        // Fungsi untuk memeriksa apakah perlu menjalankan scheduler
        const checkAndRunScheduler = () => {
            // Reset cache status admin untuk memastikan akurasi
            window._isAdminCached = undefined;

            // Jika bukan staff admin, hentikan scheduler jika berjalan
            if (!isStaffAdmin()) {
                if (isRunning) {
                    stopScheduler();
                    console.log('Scheduler dihentikan: Pengguna bukan staff admin');
                }
                return;
            }

            const { inOperationalHours } = getWIBTime();

            // Jika diluar jam operasional dan scheduler masih berjalan, hentikan
            if (!inOperationalHours && isRunning) {
                stopScheduler();
                console.log('Scheduler dihentikan: Di luar jam operasional (05:00-18:00 WIB)');
                return;
            }

            // Jika dalam jam operasional dan scheduler belum berjalan, jalankan
            if (inOperationalHours && !isRunning) {
                startScheduler();
                console.log('Scheduler dimulai: Dalam jam operasional (05:00-18:00 WIB)');
            }
        };

        // Fungsi untuk berbagi informasi scheduler antar tab/halaman
        const syncSchedulerState = () => {
            const lastSyncTimestamp = Date.now();

            try {
                localStorage.setItem(`${STORAGE_KEY_PREFIX}sync`, lastSyncTimestamp.toString());
                localStorage.setItem(`${STORAGE_KEY_PREFIX}lastCheck`, lastSyncTimestamp.toString());
            } catch (e) {
                console.error('Gagal sinkronisasi state scheduler:', e);
            }
        };

        // Fungsi untuk memulai scheduler
        const startScheduler = () => {
            if (!isStaffAdmin() || isRunning) return;

            // Jalankan sekali saat mulai jika belum pernah dijalankan atau jika sudah lewat dari interval
            const now = Date.now();
            if (now - lastRunTimestamp >= INTERVAL_MS) {
                executeProcess(true);
            }

            // Bersihkan timer yang mungkin masih ada
            if (scheduler !== null) {
                clearInterval(scheduler);
            }

            // Pastikan interval untuk timer adalah tepat interval yang ditentukan
            scheduler = setInterval(() => {
                executeProcess(true);
            }, INTERVAL_MS);

            isRunning = true;

            // Simpan status scheduler di localStorage untuk persistensi antar halaman
            localStorage.setItem(`${STORAGE_KEY_PREFIX}running`, 'true');
            localStorage.setItem(`${STORAGE_KEY_PREFIX}lastCheck`, Date.now().toString());

            // Sinkronisasi status dengan tab lain
            syncSchedulerState();
        };

        // Fungsi untuk menghentikan scheduler
        const stopScheduler = () => {
            if (!isRunning) return;

            clearInterval(scheduler);
            scheduler = null;
            isRunning = false;

            // Hapus status di localStorage
            localStorage.removeItem(`${STORAGE_KEY_PREFIX}running`);

            // Sinkronisasi status dengan tab lain
            syncSchedulerState();
        };

        // Inisialisasi: Periksa localStorage apakah scheduler sebelumnya berjalan
        const initScheduler = () => {
            // Gunakan debounce untuk mencegah multiple initialization
            if (initDebounceTimer) clearTimeout(initDebounceTimer);

            initDebounceTimer = setTimeout(() => {
                // Cek jika sudah diinisialisasi sebelumnya untuk menghindari multiple init
                if (initialized) return;
                initialized = true;

                // Jika bukan staff admin, jangan inisialisasi scheduler
                if (!isStaffAdmin()) return;

                const wasRunning = localStorage.getItem(`${STORAGE_KEY_PREFIX}running`) === 'true';
                const lastCheck = parseInt(localStorage.getItem(`${STORAGE_KEY_PREFIX}lastCheck`) || '0', 10);

                // Ambil timestamp terakhir dijalankan dari localStorage
                lastRunTimestamp = parseInt(localStorage.getItem(`${STORAGE_KEY_PREFIX}lastRun`) || '0', 10);

                // Jika terakhir check lebih dari 5 menit yang lalu, reset status
                if (Date.now() - lastCheck > 5 * 60 * 1000) {
                    localStorage.removeItem(`${STORAGE_KEY_PREFIX}running`);
                    localStorage.removeItem(`${STORAGE_KEY_PREFIX}lastCheck`);
                    localStorage.removeItem(`${STORAGE_KEY_PREFIX}lastRun`);
                } else if (wasRunning) {
                    // Jalankan scheduler jika sebelumnya sedang berjalan
                    checkAndRunScheduler();
                }
            }, DEBOUNCE_TIME);
        };

        // Pasang listener events dengan throttling/debouncing
        const setupEventListeners = () => {
            // Observer and event handlers with debouncing
            let urlChangeDebounce = null;
            let lastUrl = location.href;

            // URL Change detection for SPAs
            const handleUrlChange = () => {
                if (urlChangeDebounce) clearTimeout(urlChangeDebounce);
                urlChangeDebounce = setTimeout(() => {
                    if (lastUrl !== location.href) {
                        lastUrl = location.href;
                        // Reset admin cache saat URL berubah
                        window._isAdminCached = undefined;
                        checkAndRunScheduler();
                    }
                }, DEBOUNCE_TIME);
            };

            // Visibility change handler
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    // Reset cache dan periksa status
                    window._isAdminCached = undefined;
                    checkAndRunScheduler();
                }
            });

            // History API override dengan behavior yang lebih stabil
            const originalPushState = history.pushState;
            history.pushState = function () {
                originalPushState.apply(this, arguments);
                handleUrlChange();
            };

            const originalReplaceState = history.replaceState;
            history.replaceState = function () {
                originalReplaceState.apply(this, arguments);
                handleUrlChange();
            };

            // Popstate event
            window.addEventListener('popstate', handleUrlChange);

            // Storage event untuk sinkronisasi antar tab
            window.addEventListener('storage', (event) => {
                if (event.key === `${STORAGE_KEY_PREFIX}running`) {
                    const shouldRun = event.newValue === 'true';

                    if (shouldRun && !isRunning) {
                        startScheduler();
                    } else if (!shouldRun && isRunning) {
                        stopScheduler();
                    }
                }

                if (event.key === `${STORAGE_KEY_PREFIX}lastRun`) {
                    lastRunTimestamp = parseInt(event.newValue || '0', 10);
                }

                if (event.key === `${STORAGE_KEY_PREFIX}sync`) {
                    checkAndRunScheduler();
                }
            });
        };

        // Setup mutation observer setelah DOM siap
        const setupMutationObserver = () => {
            // Penggunaan throttling untuk observer
            let mutationDebounce = null;

            // Function untuk menangani mutasi dengan throttling
            const handleMutation = () => {
                if (mutationDebounce) clearTimeout(mutationDebounce);
                mutationDebounce = setTimeout(() => {
                    // Reset cache status admin untuk memastikan akurasi deteksi
                    window._isAdminCached = undefined;
                    checkAndRunScheduler();
                }, DEBOUNCE_TIME);
            };

            // Target elements yang akan diobservasi
            const targetNodes = [
                document.body,
                document.getElementById('app'),
                document.getElementById('main-content'),
                document.querySelector('.staffadmin-wrapper'),
            ].filter(Boolean);

            if (targetNodes.length === 0) targetNodes.push(document.body);

            // Buat observer dengan config optimal
            const observer = new MutationObserver(handleMutation);

            // Mulai observasi dengan optimized configuration
            targetNodes.forEach((node) => {
                observer.observe(node, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['class', 'id', 'data-staffadmin-role'],
                });
            });
        };

        // Set interval untuk periksa jam operasional yang lebih hemat sumber daya (lebih jarang cek)
        const setupOperationalCheck = () => {
            // Cek setiap 5 menit sekali, dengan throttling untuk mencegah multiple checks
            const operationalCheckInterval = setInterval(
                () => {
                    checkAndRunScheduler();
                },
                5 * 60 * 1000,
            );

            // Untuk memastikan garbage collection tidak terjadi
            window._staffAdminIntervals = window._staffAdminIntervals || [];
            window._staffAdminIntervals.push(operationalCheckInterval);
        };

        // Inisialisasi sistem - SINGLE ENTRY POINT untuk mencegah multiple init
        const initialize = () => {
            if (window._absenceSystemInitialized) return;
            window._absenceSystemInitialized = true;

            // Setup dengan urutan yang tepat untuk menghindari race condition
            setupEventListeners();
            initScheduler();
            setupOperationalCheck();

            // Setup mutation observer setelah semuanya siap
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                setupMutationObserver();
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(setupMutationObserver, DEBOUNCE_TIME);
                });
            }
        };

        // Inisialisasi hanya sekali saat script dimuat
        initialize();

        // Fungsi yang diekspos ke publik
        return (manualTrigger = false) => {
            if (manualTrigger) {
                // Jika dipanggil secara manual (misalnya dari tombol)
                executeProcess(false);
            } else {
                // Jika dipanggil otomatis, cek dan update scheduler
                checkAndRunScheduler();
            }
        };
    })();

    // Jalankan pengecekan saat halaman dimuat - hanya sekali
    if (window._absenceInitLoaded) {
        console.log('System already initialized, skipping');
    } else {
        window._absenceInitLoaded = true;

        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            processAutomaticAbsence();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                processAutomaticAbsence();
            });
        }
    }

    // Fungsi untuk mengubah status kehadiran siswa
    const updateAttendanceStatus = (recapId, statusName, isVerified = true) => {
        // Definisi mapping status name ke status ID
        // Ini bisa diambil dari API atau props jika tersedia
        const statusMap = {
            Hadir: 1,
            Terlambat: 2,
            Izin: 3,
            Sakit: 4,
            Alfa: 5,
        };

        // Dapatkan ID status dari nama
        const statusId = statusMap[statusName];

        // Validasi status
        if (!statusId) {
            alert(`Status "${statusName}" tidak valid.`);
            return;
        }

        // Tambahkan logging untuk debugging
        console.log(`Mencoba update status: ID=${recapId}, StatusName=${statusName}, StatusID=${statusId}`);

        // Store the update in localStorage to track that this record has been updated
        const storageKey = `attendance_updated_${recapId}`;

        // Komentar sementara untuk pengujian - hapus jika tidak diperlukan
        // if (localStorage.getItem(storageKey)) {
        //     alert('Status presensi ini sudah diubah sebelumnya dan tidak dapat diubah kembali.');
        //     return;
        // }

        // Confirm the change
        if (!confirm(`Ubah status menjadi "${statusName}"? Perubahan ini tidak dapat diurungkan.`)) {
            return;
        }

        // Log data request sebelum dikirim
        console.log('Data yang dikirim ke server:', {
            recap_id: recapId,
            status_id: statusId,
            is_verified: isVerified,
        });

        // Kirim request ke server
        router.put(
            route('staffadmin.attendance.update-status'),
            {
                recap_id: recapId,
                status_id: statusId,
                is_verified: isVerified,
            },
            {
                onSuccess: (response) => {
                    // Log response untuk debugging
                    console.log('Response dari server:', response);

                    // Verifikasi status yang diterima dari server
                    const returnedStatus = response.data?.status || 'Unknown';
                    console.log(`Status setelah update: ${returnedStatus}`);

                    if (returnedStatus !== statusName && returnedStatus !== 'Unknown') {
                        console.warn(`Warning: Status yang diminta (${statusName}) berbeda dengan yang diterima (${returnedStatus})`);
                    }

                    // Simpan di localStorage bahwa record ini telah diupdate
                    localStorage.setItem(
                        storageKey,
                        JSON.stringify({
                            timestamp: new Date().toISOString(),
                            newStatus: statusName,
                            serverStatus: returnedStatus,
                        }),
                    );

                    // Tampilkan pesan sukses
                    alert(response.props?.flash?.message || `Status berhasil diubah menjadi "${statusName}"`);

                    // Reload halaman untuk merefleksikan perubahan
                    window.location.reload();
                },
                onError: (errors) => {
                    // Log error untuk debugging
                    console.error('Error saat update status:', errors);
                    alert(errors.message || 'Terjadi kesalahan saat memperbarui status');
                },
            },
        );
    };

    // Component for the Attendance Status Cell
    const AttendanceStatusCell = ({ record }) => {
        const storageKey = `attendance_updated_${record.id}`;
        const wasUpdated = localStorage.getItem(storageKey) !== null;

        if (record.status_name === 'Alfa' && !wasUpdated) {
            return (
                <td className="px-4 py-3 text-center text-sm whitespace-nowrap">
                    <div className="flex justify-center space-x-2">
                        <button
                            onClick={() => updateAttendanceStatus(record.id, 'Sakit', true)}
                            className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                        >
                            Sakit
                        </button>
                        <button
                            onClick={() => updateAttendanceStatus(record.id, 'Izin', true)}
                            className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200"
                        >
                            Izin
                        </button>
                    </div>
                </td>
            );
        }

        return (
            <td className="px-4 py-3 text-center text-sm whitespace-nowrap">
                <span className={getStatusClassName(record.status_name)}>
                    {record.status_name}
                    {wasUpdated && <span className="ml-1 text-xs text-gray-500">(Telah diubah)</span>}
                </span>
            </td>
        );
    };

    const getStatusClassName = (statusName) => {
        switch (statusName) {
            case 'Hadir':
                return 'rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700';
            case 'Terlambat':
                return 'rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700';
            case 'Sakit':
                return 'rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700';
            case 'Izin':
                return 'rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700';
            case 'Alfa':
                return 'rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700';
            default:
                return 'rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700';
        }
    };

    // Export to CSV function
    const exportToCSV = () => {
        // Create CSV content
        let csvContent = 'ID,Nama Siswa,Status,Waktu,Angkatan,Kelas,Semester\n';

        filteredRecords.forEach((record) => {
            csvContent += `${record.id},`;
            csvContent += `"${record.student_name}",`;
            csvContent += `${record.status_name},`;
            csvContent += `${formatDateTime(record.timestamp)},`;
            csvContent += `${record.batch},`;
            csvContent += `${record.class_name},`;
            csvContent += `${record.semester}\n`;
        });

        // Create a blob and download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `rekap-kehadiran-${selectedDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AppLayoutStaffAdmin breadcrumbs={breadcrumbs}>
            <Head title="Rekap Kehadiran - Tata Usaha" />
            <div className="flex">
                <main className="min-h-screen flex-1 p-5">
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative mt-4 min-h-[70vh] flex-1 overflow-hidden rounded-xl border bg-white p-6 text-gray-800 md:min-h-min dark:bg-gray-900 dark:text-white">
                        <div className="mb-6 flex flex-col items-start justify-between sm:flex-row sm:items-center">
                            <h2 className="mb-4 text-2xl font-bold sm:mb-0">Rekap Kehadiran Siswa</h2>

                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href="/staffadmin/scan-qr-attendance"
                                    className="flex items-center rounded-md bg-blue-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-blue-700"
                                >
                                    <QrCode className="mr-2 h-5 w-5" />
                                    Scan QR Presensi
                                </Link>

                                {/* <button
                                    onClick={processAutomaticAbsence}
                                    className="flex items-center rounded-md bg-red-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-red-700"
                                >
                                    <Calendar className="mr-2 h-5 w-5" />
                                    Proses Ketidakhadiran
                                </button> */}

                                <button
                                    onClick={exportToCSV}
                                    className="flex items-center rounded-md bg-green-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-green-700"
                                >
                                    <ArrowDownToLine className="mr-2 h-5 w-5" />
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        {/* Statistics Dashboard */}
                        {showStatistics && (
                            <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="flex items-center text-lg font-semibold">
                                        <BarChart className="mr-2 h-5 w-5" />
                                        Statistik Kehadiran
                                    </h3>
                                    <button
                                        onClick={() => setShowStatistics(!showStatistics)}
                                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    ></button>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-700">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Total Siswa</div>
                                        <div className="text-2xl font-bold">{statistics.total}</div>
                                    </div>

                                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm dark:border-green-800 dark:bg-green-900">
                                        <div className="text-sm text-green-600 dark:text-green-300">Hadir</div>
                                        <div className="text-2xl font-bold text-green-700 dark:text-green-200">
                                            {statistics.present}
                                            <span className="ml-1 text-sm">({percentages.present}%)</span>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-800 dark:bg-red-900">
                                        <div className="text-sm text-red-600 dark:text-red-300">Tidak Hadir</div>
                                        <div className="text-2xl font-bold text-red-700 dark:text-red-200">
                                            {statistics.absent}
                                            <span className="ml-1 text-sm">({percentages.absent}%)</span>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 shadow-sm dark:border-yellow-800 dark:bg-yellow-900">
                                        <div className="text-sm text-yellow-600 dark:text-yellow-300">Terlambat</div>
                                        <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-200">
                                            {statistics.late}
                                            <span className="ml-1 text-sm">({percentages.late}%)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Filter Bar */}
                        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                            <div className="mb-4 flex flex-col gap-4 md:flex-row">
                                {/* Search */}
                                <div className="relative flex-1">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <Search className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="block w-full rounded-md border border-gray-300 py-2 pr-3 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        placeholder="Cari berdasarkan nama siswa..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                {/* Status Filter */}
                                <div className="relative w-full md:w-48">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <Filter className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <select
                                        className="block w-full rounded-md border border-gray-300 py-2 pr-3 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                    >
                                        <option value="all">Semua Status</option>
                                        <option value="present">Hadir</option>
                                        <option value="absent">Tidak Hadir</option>
                                        <option value="late">Terlambat</option>
                                    </select>
                                </div>

                                {/* View Mode Toggle */}
                                <div className="flex items-center space-x-2 rounded-md border border-gray-300 bg-white p-1 dark:border-gray-600 dark:bg-gray-700">
                                    <button
                                        className={`flex items-center rounded px-3 py-1 ${
                                            viewMode === 'card'
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                                                : 'text-gray-700 dark:text-gray-300'
                                        }`}
                                        onClick={() => setViewMode('card')}
                                    >
                                        <Grid className="mr-1 h-4 w-4" />
                                        <span>Card</span>
                                    </button>
                                    <button
                                        className={`flex items-center rounded px-3 py-1 ${
                                            viewMode === 'table'
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                                                : 'text-gray-700 dark:text-gray-300'
                                        }`}
                                        onClick={() => setViewMode('table')}
                                    >
                                        <List className="mr-1 h-4 w-4" />
                                        <span>Table</span>
                                    </button>
                                </div>
                            </div>

                            {/* Date and Additional Filters */}
                            <div className="flex flex-col gap-4 md:flex-row">
                                {/* Date Selector */}
                                <div className="flex flex-col space-y-2 md:w-1/3">
                                    <label className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                        <Calendar className="mr-1 h-4 w-4" />
                                        Tanggal
                                    </label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={handleDateChange}
                                        className="rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>

                                {/* Additional Filters */}
                                <div className="grid grid-cols-1 gap-4 md:w-2/3 md:grid-cols-3">
                                    {/* Batch/Angkatan Filter */}
                                    <div>
                                        <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Angkatan</label>
                                        <select
                                            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            value={filterBatch}
                                            onChange={(e) => setFilterBatch(e.target.value)}
                                        >
                                            <option value="all">Semua Angkatan</option>
                                            {uniqueBatches
                                                .sort((a, b) => b - a) // Mengurutkan dari terbaru ke terlama (descending)
                                                .map((batch) => (
                                                    <option key={batch} value={batch}>
                                                        Angkatan {batch}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    {/* Class Filter */}
                                    <div>
                                        <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Kelas</label>
                                        <select
                                            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            value={filterClass}
                                            onChange={(e) => setFilterClass(e.target.value)}
                                        >
                                            <option value="all">Semua Kelas</option>
                                            {uniqueClasses.sort().map((className) => (
                                                <option key={className} value={className}>
                                                    {className}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Semester Filter */}
                                    <div>
                                        <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Semester</label>
                                        <select
                                            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            value={filterSemester}
                                            onChange={(e) => setFilterSemester(e.target.value)}
                                        >
                                            <option value="all">Semua Semester</option>
                                            {uniqueSemesters.sort().map((semester) => (
                                                <option key={semester} value={semester}>
                                                    Semester {semester}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* No Data Message */}
                        {filteredRecords.length === 0 && (
                            <div className="rounded-lg border border-gray-200 p-10 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                <div className="mb-4 flex justify-center">
                                    <Search className="h-12 w-12 text-gray-400" />
                                </div>
                                <h3 className="mb-2 text-lg font-medium">Tidak ada data kehadiran</h3>
                                <p>Tidak ada data kehadiran yang sesuai dengan filter yang dipilih.</p>
                            </div>
                        )}

                        {/* Card View */}
                        {filteredRecords.length > 0 && viewMode === 'card' && (
                            <>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                                                className="overflow-hidden rounded-lg border border-gray-200 shadow-sm dark:border-gray-700"
                                            >
                                                {/* Card Header */}
                                                <div className="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                                                    <div className="mb-1 flex items-center justify-between">
                                                        <h3 className="text-lg font-semibold">Kelas {group.class_name}</h3>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                            {group.students.length} siswa
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                        <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                                                            Angkatan {group.batch}
                                                        </span>
                                                        <span className="rounded-full bg-purple-100 px-2 py-1 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                                                            Semester {group.semester}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Card Content dengan Grid Layout */}
                                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                                    {/* Header row */}
                                                    <div className="grid grid-cols-12 bg-gray-50 p-3 text-sm font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                                        <div className="col-span-5">Nama Siswa</div>
                                                        <div className="col-span-3 text-center">Status</div>
                                                        <div className="col-span-4 text-right">Waktu</div>
                                                    </div>

                                                    {displayStudents.map((student) => (
                                                        <div
                                                            key={student.id}
                                                            className="grid grid-cols-12 items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                                                        >
                                                            {/* Kolom Nama Siswa */}
                                                            <div className="group relative col-span-5">
                                                                {isLongName(student.student_name) ? (
                                                                    <>
                                                                        <div
                                                                            className={`font-medium text-gray-900 dark:text-white ${expandedNames[student.id] ? '' : 'truncate'} cursor-pointer hover:text-blue-600 dark:hover:text-blue-400`}
                                                                            title="Klik untuk melihat nama lengkap"
                                                                            onClick={() => handleNameClick(student.id)}
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
                                                                <span
                                                                    className={`inline-block rounded-full px-2 py-1 text-xs ${getStatusStyle(student.status)}`}
                                                                >
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
                                                        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {startItem}-{endItem} dari {totalStudents}
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <button
                                                                    onClick={() => handlePrevStudentsPage(globalGroupIndex)}
                                                                    disabled={currentStudentsPage === 0}
                                                                    className={`rounded-md p-1 ${
                                                                        currentStudentsPage === 0
                                                                            ? 'cursor-not-allowed text-gray-400'
                                                                            : 'text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900'
                                                                    }`}
                                                                    aria-label="Previous page"
                                                                >
                                                                    <ChevronLeft className="h-5 w-5" />
                                                                </button>

                                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                                    {currentStudentsPage + 1} / {totalStudentsPages}
                                                                </span>

                                                                <button
                                                                    onClick={() => handleNextStudentsPage(globalGroupIndex)}
                                                                    disabled={currentStudentsPage >= totalStudentsPages - 1}
                                                                    className={`rounded-md p-1 ${
                                                                        currentStudentsPage >= totalStudentsPages - 1
                                                                            ? 'cursor-not-allowed text-gray-400'
                                                                            : 'text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900'
                                                                    }`}
                                                                    aria-label="Next page"
                                                                >
                                                                    <ChevronRight className="h-5 w-5" />
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
                                        <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                            <div className="flex items-center space-x-4">
                                                <button
                                                    onClick={handlePrevCardsPage}
                                                    disabled={currentPage === 0}
                                                    className={`flex items-center rounded-md px-3 py-1 ${
                                                        currentPage === 0
                                                            ? 'cursor-not-allowed text-gray-400'
                                                            : 'text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900'
                                                    }`}
                                                    aria-label="Previous page"
                                                >
                                                    <ChevronLeft className="mr-1 h-5 w-5" />
                                                    <span>Sebelumnya</span>
                                                </button>

                                                <div className="flex items-center text-sm">
                                                    <span className="text-gray-700 dark:text-gray-300">
                                                        Halaman <span className="font-medium">{currentPage + 1}</span> dari{' '}
                                                        <span className="font-medium">{totalPages}</span>
                                                    </span>
                                                </div>

                                                <button
                                                    onClick={handleNextCardsPage}
                                                    disabled={currentPage >= totalPages - 1}
                                                    className={`flex items-center rounded-md px-3 py-1 ${
                                                        currentPage >= totalPages - 1
                                                            ? 'cursor-not-allowed text-gray-400'
                                                            : 'text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900'
                                                    }`}
                                                    aria-label="Next page"
                                                >
                                                    <span>Selanjutnya</span>
                                                    <ChevronRight className="ml-1 h-5 w-5" />
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

                        {/* Table View */}
                        {filteredRecords.length > 0 && viewMode === 'table' && (
                            <>
                                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-800">
                                            <tr>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                                >
                                                    Nama Siswa
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                                >
                                                    Kelas
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                                >
                                                    Angkatan
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                                >
                                                    Semester
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                                >
                                                    Status
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                                >
                                                    Tanggal
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                                >
                                                    Waktu
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400"
                                                >
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                            {paginatedTableRecords.map((record) => {
                                                // Parse timestamp for separate date and time display
                                                const timestampDate = new Date(record.timestamp);
                                                const formattedDate = formatDate(record.timestamp);
                                                const formattedTime =
                                                    timestampDate.toLocaleTimeString('id-ID', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: false,
                                                    }) + ' WIB';

                                                return (
                                                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            {isLongName(record.student_name) ? (
                                                                <div
                                                                    className={`font-medium text-gray-900 dark:text-white ${expandedNames[record.id] ? '' : 'max-w-xs truncate'} cursor-pointer hover:text-blue-600 dark:hover:text-blue-400`}
                                                                    title="Klik untuk melihat nama lengkap"
                                                                    onClick={() => handleNameClick(record.id)}
                                                                >
                                                                    {record.student_name}
                                                                </div>
                                                            ) : (
                                                                <div className="font-medium text-gray-900 dark:text-white">{record.student_name}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-700 dark:text-gray-300">
                                                            {record.class_name}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-700 dark:text-gray-300">
                                                            {record.batch}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-700 dark:text-gray-300">
                                                            {record.semester}
                                                        </td>
                                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                                            <span
                                                                className={`inline-block rounded-full px-2 py-1 text-xs ${getStatusStyle(record.status)}`}
                                                            >
                                                                {record.status_name}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-700 dark:text-gray-300">
                                                            {formattedDate}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-700 dark:text-gray-300">
                                                            {formattedTime}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">{record.student_name}</div>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <div className="text-sm text-gray-500">{record.class_name}</div>
                                                        </td>

                                                        <AttendanceStatusCell record={record} />

                                                        <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-500">
                                                            {new Date(record.timestamp).toLocaleString('id-ID', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Table Pagination */}
                                {totalTablePages > 1 && (
                                    <div className="mt-6 flex items-center justify-between">
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            Menampilkan {tableCurrentPage * tableRowsPerPage + 1} -{' '}
                                            {Math.min((tableCurrentPage + 1) * tableRowsPerPage, filteredRecords.length)} dari{' '}
                                            {filteredRecords.length} entri
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={handlePrevTablePage}
                                                disabled={tableCurrentPage === 0}
                                                className={`flex items-center rounded-md border px-3 py-1 ${
                                                    tableCurrentPage === 0
                                                        ? 'cursor-not-allowed border-gray-300 text-gray-400'
                                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800'
                                                }`}
                                                aria-label="Previous page"
                                            >
                                                <ChevronLeft className="mr-1 h-5 w-5" />
                                                <span>Sebelumnya</span>
                                            </button>

                                            {/* Page Numbers */}
                                            <div className="hidden space-x-1 md:flex">
                                                {[...Array(Math.min(5, totalTablePages))].map((_, idx) => {
                                                    // Show current page and up to 2 pages on either side
                                                    let pageNumber;

                                                    if (totalTablePages <= 5) {
                                                        pageNumber = idx;
                                                    } else if (tableCurrentPage < 2) {
                                                        pageNumber = idx;
                                                    } else if (tableCurrentPage > totalTablePages - 3) {
                                                        pageNumber = totalTablePages - 5 + idx;
                                                    } else {
                                                        pageNumber = tableCurrentPage - 2 + idx;
                                                    }

                                                    if (pageNumber >= 0 && pageNumber < totalTablePages) {
                                                        return (
                                                            <button
                                                                key={pageNumber}
                                                                onClick={() => setTableCurrentPage(pageNumber)}
                                                                className={`rounded-md px-3 py-1 ${
                                                                    tableCurrentPage === pageNumber
                                                                        ? 'bg-blue-600 text-white'
                                                                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                                                                }`}
                                                            >
                                                                {pageNumber + 1}
                                                            </button>
                                                        );
                                                    }
                                                    return null;
                                                })}
                                            </div>

                                            <button
                                                onClick={handleNextTablePage}
                                                disabled={tableCurrentPage >= totalTablePages - 1}
                                                className={`flex items-center rounded-md border px-3 py-1 ${
                                                    tableCurrentPage >= totalTablePages - 1
                                                        ? 'cursor-not-allowed border-gray-300 text-gray-400'
                                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800'
                                                }`}
                                                aria-label="Next page"
                                            >
                                                <span>Selanjutnya</span>
                                                <ChevronRight className="ml-1 h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>
        </AppLayoutStaffAdmin>
    );
}
