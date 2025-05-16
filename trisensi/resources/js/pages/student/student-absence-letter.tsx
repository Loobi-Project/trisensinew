import { useState, useMemo, useEffect } from 'react';
import AppLayoutStudent from '@/layouts/student/app-layout-student';
import { Head, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';
import * as mammoth from 'mammoth';

type AbsenceLetterTemplate = {
    id: number;
    name: string;
    file_path: string;
    preview_image?: string; 
};

export default function StudentAbsenceLetter() {
    const { props } = usePage<{ templates: AbsenceLetterTemplate[] }>();
    const templates = props.templates;
    const [selectedTemplate, setSelectedTemplate] = useState<AbsenceLetterTemplate | null>(null);
    const [previewContent, setPreviewContent] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isMobile, setIsMobile] = useState(false);
    
    // Check screen size on mount and window resize
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        
        return () => {
            window.removeEventListener('resize', checkScreenSize);
        };
    }, []);
    
    // Konstanta untuk jumlah item per halaman, responsif berdasarkan ukuran layar
    const ITEMS_PER_PAGE = isMobile ? 5 : 10;

    // Menghitung total halaman
    const totalPages = Math.ceil(templates.length / ITEMS_PER_PAGE);

    // Memotong template sesuai halaman saat ini
    const paginatedTemplates = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return templates.slice(startIndex, endIndex);
    }, [templates, currentPage, ITEMS_PER_PAGE]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: {
                delayChildren: 0.2,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { 
            y: 0, 
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 24
            }
        }
    };

    const openPreviewModal = async (template: AbsenceLetterTemplate) => {
        setSelectedTemplate(template);
        setPreviewContent(null);

        try {
            const response = await fetch(template.file_path);
            const arrayBuffer = await response.arrayBuffer();
            
            const result = await mammoth.convertToHtml({ arrayBuffer });
            setPreviewContent(result.value);
        } catch (error) {
            console.error('Error fetching or converting document:', error);
            setPreviewContent('Gagal memuat pratinjau.');
        }
    };

    const closePreviewModal = () => {
        setSelectedTemplate(null);
        setPreviewContent(null);
    };

    // Fungsi untuk mengubah halaman
    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <AppLayoutStudent
            breadcrumbs={[
                { title: 'Dashboard Siswa', href: route('student.dashboard') },
                { title: 'Surat Keterangan', href: route('student.select-letter-absence') },
            ]}
        >
            <Head title="Surat Keterangan Ketidakhadiran" />
            
            <div className="min-h-screen w-full px-4 sm:px-6 lg:px-8 py-5">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-4xl mx-auto rounded-xl border bg-white p-4 sm:p-6 shadow-md 
                    dark:bg-gray-800 dark:border-gray-700"
                >
                    <h2 className="mb-4 text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                        Surat Keterangan Ketidakhadiran
                    </h2>
                    <p className="mb-6 text-sm sm:text-base text-gray-600 dark:text-gray-300">
                        Pilih template surat untuk pratinjau dan unduh dokumen.
                    </p>

                    <motion.ul 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-3 sm:space-y-4"
                    >
                        {paginatedTemplates.map((template) => (
                            <motion.li
                                key={template.id}
                                variants={itemVariants}
                                className="group"
                            >
                                <div className="flex flex-col sm:flex-row items-start sm:items-center 
                                    justify-between rounded-lg border p-3 sm:p-4 
                                    transition-all duration-300 
                                    hover:bg-gray-50 hover:shadow-md 
                                    dark:border-gray-700 
                                    dark:hover:bg-gray-700"
                                >
                                    <div className="flex items-center space-x-2 sm:space-x-4 mb-2 sm:mb-0 w-full">
                                        <FileText 
                                            className="text-gray-500 dark:text-gray-300 
                                            group-hover:text-blue-500 dark:group-hover:text-blue-400 
                                            w-5 h-5 sm:w-6 sm:h-6" 
                                        />
                                        <span className="font-medium text-sm sm:text-base text-gray-800 dark:text-white truncate">
                                            {template.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
                                        <button
                                            onClick={() => openPreviewModal(template)}
                                            className="text-blue-600 hover:text-blue-800 
                                            dark:text-blue-400 dark:hover:text-blue-300 
                                            transition-colors duration-300 
                                            p-1 sm:p-2 rounded-md hover:bg-blue-50 
                                            dark:hover:bg-blue-900/30 
                                            flex items-center text-xs sm:text-sm"
                                        >
                                            <Eye size={14} className="mr-1" />
                                            Pratinjau
                                        </button>
                                        <a
                                            href={template.file_path}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-green-600 hover:text-green-800 
                                            dark:text-green-400 dark:hover:text-green-300 
                                            transition-colors duration-300 
                                            p-1 sm:p-2 rounded-md hover:bg-green-50 
                                            dark:hover:bg-green-900/30 
                                            flex items-center text-xs sm:text-sm"
                                        >
                                            <Download size={14} className="mr-1" />
                                            Unduh
                                        </a>
                                    </div>
                                </div>
                            </motion.li>
                        ))}
                    </motion.ul>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center mt-4 sm:mt-6 space-x-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-1 sm:p-2 rounded-md bg-gray-200 dark:bg-gray-700 
                                disabled:opacity-50 disabled:cursor-not-allowed
                                hover:bg-gray-300 dark:hover:bg-gray-600 
                                transition-colors duration-300"
                            >
                                <ChevronLeft size={isMobile ? 16 : 20} />
                            </button>
                            <span className="text-xs sm:text-base text-gray-700 dark:text-gray-300">
                                Halaman {currentPage} dari {totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-1 sm:p-2 rounded-md bg-gray-200 dark:bg-gray-700 
                                disabled:opacity-50 disabled:cursor-not-allowed
                                hover:bg-gray-300 dark:hover:bg-gray-600 
                                transition-colors duration-300"
                            >
                                <ChevronRight size={isMobile ? 16 : 20} />
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* Preview Modal */}
                <AnimatePresence>
                    {selectedTemplate && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl 
                                w-full max-w-md sm:max-w-lg md:max-w-xl p-4 sm:p-6 relative 
                                max-h-[80vh] overflow-auto"
                            >
                                <button 
                                    onClick={closePreviewModal}
                                    className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 
                                    hover:text-gray-900 dark:hover:text-white 
                                    transition-colors duration-300"
                                >
                                    <X size={isMobile ? 20 : 24} />
                                </button>

                                <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 dark:text-white">
                                    Pratinjau: {selectedTemplate.name}
                                </h3>

                                <div className="w-full aspect-[16/9] rounded-lg overflow-hidden mb-4 
                                bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                    {previewContent ? (
                                        <div 
                                            className="w-full h-full overflow-auto p-2 sm:p-4 
                                            text-xs sm:text-sm text-gray-800 dark:text-gray-200"
                                            dangerouslySetInnerHTML={{ __html: previewContent }}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <FileText 
                                                size={isMobile ? 48 : 64} 
                                                className="text-blue-500 mb-4" 
                                            />
                                            <p className="text-xs sm:text-base text-gray-600 dark:text-gray-300">
                                                Memuat Pratinjau...
                                            </p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex justify-end space-x-2 sm:space-x-3">
                                    <button
                                        onClick={closePreviewModal}
                                        className="px-2 py-1 sm:px-4 sm:py-2 bg-gray-200 dark:bg-gray-700 
                                        text-xs sm:text-base text-gray-700 dark:text-gray-300 rounded-md 
                                        hover:bg-gray-300 dark:hover:bg-gray-600 
                                        transition-colors duration-300"
                                    >
                                        Tutup
                                    </button>
                                    <a
                                        href={selectedTemplate.file_path}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2 py-1 sm:px-4 sm:py-2 bg-blue-600 text-white 
                                        text-xs sm:text-base rounded-md 
                                        hover:bg-blue-700 transition-colors duration-300 
                                        flex items-center"
                                    >
                                        <Download size={isMobile ? 14 : 16} className="mr-1" />
                                        Unduh
                                    </a>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </AppLayoutStudent>
    );
}