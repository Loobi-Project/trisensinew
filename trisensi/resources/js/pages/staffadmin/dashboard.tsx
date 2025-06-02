import AppLayoutStaffAdmin from '@/layouts/staffadmin/app-layout-staffadmin';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard Staff Admin',
        href: '/staffadmin/dashboard',
    },
];

interface Note {
    id: string;
    content: string;
    createdAt: string;
    color: string;
    expanded?: boolean; // To track expanded state for long notes
    isEditing?: boolean; // To track if a note is being edited
}

// Array of pleasant pastel colors for note backgrounds
const noteColors = [
    'bg-blue-800/40 dark:bg-blue-800/40', 
    'bg-purple-800/40 dark:bg-purple-800/40', 
    'bg-green-800/40 dark:bg-green-800/40', 
    'bg-pink-800/40 dark:bg-pink-800/40', 
    'bg-indigo-800/40 dark:bg-indigo-800/40', 
    'bg-yellow-800/40 dark:bg-yellow-800/40',
    'bg-cyan-800/40 dark:bg-cyan-800/40', 
    'bg-amber-800/40 dark:bg-amber-800/40'
];

// Light mode variants
const lightNoteColors = [
    'bg-blue-200/60 dark:bg-blue-800/40', 
    'bg-purple-200/60 dark:bg-purple-800/40', 
    'bg-green-200/60 dark:bg-green-800/40', 
    'bg-pink-200/60 dark:bg-pink-800/40', 
    'bg-indigo-200/60 dark:bg-indigo-800/40', 
    'bg-yellow-200/60 dark:bg-yellow-800/40',
    'bg-cyan-200/60 dark:bg-cyan-800/40', 
    'bg-amber-200/60 dark:bg-amber-800/40'
];

// Number of notes per page
const NOTES_PER_PAGE = 6;

// Character limit for preview
const CHAR_LIMIT = 150;

export default function Dashboard() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [animated, setAnimated] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageTransition, setPageTransition] = useState<'left' | 'right' | null>(null);
    const [editingNote, setEditingNote] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const noteInputRef = useRef<HTMLTextAreaElement>(null);
    const editInputRef = useRef<HTMLTextAreaElement>(null);

    // Load notes from localStorage when component mounts
    useEffect(() => {
        const savedNotes = localStorage.getItem('teacherNotes');
        if (savedNotes) {
            setNotes(JSON.parse(savedNotes));
        }
    }, []);

    // Save notes to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('teacherNotes', JSON.stringify(notes));
    }, [notes]);

    // Focus the textarea when isAdding becomes true
    useEffect(() => {
        if (isAdding && noteInputRef.current) {
            noteInputRef.current.focus();
        }
    }, [isAdding]);

    // Focus the edit textarea when editing starts
    useEffect(() => {
        if (editingNote && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingNote]);

    // Calculate total pages
    const totalPages = Math.ceil(notes.length / NOTES_PER_PAGE);

    // Get current notes to display
    const getCurrentNotes = () => {
        const startIndex = (currentPage - 1) * NOTES_PER_PAGE;
        return notes.slice(startIndex, startIndex + NOTES_PER_PAGE);
    };

    const getRandomColor = () => {
        return lightNoteColors[Math.floor(Math.random() * lightNoteColors.length)];
    };

    const handleAddNote = () => {
        if (newNote.trim()) {
            const newId = Date.now().toString();
            const note: Note = {
                id: newId,
                content: newNote,
                createdAt: new Date().toLocaleString(),
                color: getRandomColor(),
                expanded: false,
            };
            
            // Add note and set to first page
            setNotes([note, ...notes]);
            setCurrentPage(1);
            setNewNote('');
            setIsAdding(false);
            
            // Add animation to the new note
            setAnimated([newId]);
            setTimeout(() => {
                setAnimated([]);
            }, 500);
        }
    };

    const handleDeleteNote = (id: string) => {
        // Add to animated list first for delete animation
        setAnimated([id]);
        
        // Delete after animation completes
        setTimeout(() => {
            setNotes(notes.filter(note => note.id !== id));
            
            // If current page is now empty and not the first page, go back one page
            const updatedNotes = notes.filter(note => note.id !== id);
            const newTotalPages = Math.ceil(updatedNotes.length / NOTES_PER_PAGE);
            if (currentPage > newTotalPages && currentPage > 1) {
                handlePageChange(currentPage - 1);
            }
        }, 300);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAddNote();
        } else if (e.key === 'Escape') {
            setIsAdding(false);
            setNewNote('');
        }
    };

    const handleEditKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && e.ctrlKey) {
            e.preventDefault();
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage === currentPage) return;
        
        // Cancel any ongoing edits when changing pages
        if (editingNote) {
            handleCancelEdit();
        }
        
        // Set animation direction
        setPageTransition(newPage > currentPage ? 'right' : 'left');
        
        // Change page after brief delay for animation
        setTimeout(() => {
            setCurrentPage(newPage);
            setPageTransition(null);
        }, 300);
    };

    const handleStartEdit = (note: Note) => {
        setEditingNote(note.id);
        setEditContent(note.content);
    };

    const handleSaveEdit = () => {
        if (editingNote && editContent.trim()) {
            setNotes(notes.map(note => 
                note.id === editingNote 
                    ? { ...note, content: editContent, expanded: false } 
                    : note
            ));
            setEditingNote(null);
            setEditContent('');
        }
    };

    const handleCancelEdit = () => {
        setEditingNote(null);
        setEditContent('');
    };

    const toggleExpand = (id: string) => {
        setNotes(notes.map(note => 
            note.id === id 
                ? { ...note, expanded: !note.expanded } 
                : note
        ));
    };

    // Check if content needs truncation
    const needsTruncation = (content: string) => {
        return content.length > CHAR_LIMIT;
    };

    // Truncate content with ellipsis
    const truncateContent = (content: string, isExpanded: boolean = false) => {
        if (!needsTruncation(content) || isExpanded) {
            return content;
        }

        // Find the end of the first paragraph or use CHAR_LIMIT
        const firstParagraphEnd = content.indexOf('\n\n');
        
        if (firstParagraphEnd > 0 && firstParagraphEnd < CHAR_LIMIT) {
            return content.substring(0, firstParagraphEnd) + '...';
        }
        
        // Fall back to character limit if no paragraph break is found
        return content.substring(0, CHAR_LIMIT) + '...';
    };

    // Generate pagination buttons
    const renderPaginationButtons = () => {
        if (totalPages <= 1) return null;

        const buttons = [];
        
        // Previous button
        buttons.push(
            <button
                key="prev"
                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${
                    currentPage === 1 
                    ? 'text-gray-500 dark:text-gray-500 cursor-not-allowed' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
                aria-label="Previous page"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
            </button>
        );

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            buttons.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                        currentPage === i
                        ? 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    aria-label={`Page ${i}`}
                    aria-current={currentPage === i ? 'page' : undefined}
                >
                    {i}
                </button>
            );
        }

        // Next button
        buttons.push(
            <button
                key="next"
                onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${
                    currentPage === totalPages 
                    ? 'text-gray-500 dark:text-gray-500 cursor-not-allowed' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
                aria-label="Next page"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
            </button>
        );

        return (
            <div className="flex justify-center space-x-2 mt-6">
                {buttons}
            </div>
        );
    };

    return (
        <AppLayoutStaffAdmin breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - Tata Usaha" />
            <div className="flex">
                <main className="min-h-screen flex-1 p-5">
                    <div className="dark:border-sidebar-border/70 relative mt-4 min-h-[80vh] flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white p-6 text-gray-800 dark:bg-gray-900 dark:text-white">
                        {/* Header with animation */}
                        <div className="mb-8 flex items-center justify-between">
                            <h2 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent dark:from-blue-400 dark:to-purple-500">
                                Catatan Pribadi
                            </h2>
                            <button
                                onClick={() => setIsAdding(true)}
                                className="flex items-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 focus:outline-none"
                                style={{ display: isAdding ? 'none' : 'flex' }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                Catatan Baru
                            </button>
                        </div>

                        {/* Add Note Form */}
                        <div
                            className={`mb-6 transition-all duration-300 ease-in-out ${isAdding ? 'max-h-60 opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}
                        >
                            <div className="transform rounded-xl border border-gray-200 bg-gray-100/90 p-4 shadow-lg backdrop-blur-sm transition-transform duration-300 ease-in-out dark:border-gray-700 dark:bg-gray-800/50">
                                <textarea
                                    ref={noteInputRef}
                                    className="w-full resize-none rounded-lg border border-gray-300 bg-white/90 p-3 text-gray-800 transition-all duration-200 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800/80 dark:text-white"
                                    placeholder="Tulis catatan baru di sini..."
                                    rows={3}
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                />
                                <div className="mt-3 flex justify-end space-x-2">
                                    <button
                                        className="rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 font-medium text-gray-600 transition-colors duration-200 hover:bg-gray-200 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                        onClick={() => {
                                            setIsAdding(false);
                                            setNewNote('');
                                        }}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 font-medium text-white transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 focus:outline-none"
                                        onClick={handleAddNote}
                                    >
                                        Simpan
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Notes Grid with Masonry Layout and Page Transition */}
                        <div
                            className={`grid transform auto-rows-min grid-cols-1 gap-6 transition-all duration-300 sm:grid-cols-2 lg:grid-cols-3 ${
                                pageTransition === 'right'
                                    ? '-translate-x-full opacity-0'
                                    : pageTransition === 'left'
                                      ? 'translate-x-full opacity-0'
                                      : 'translate-x-0'
                            }`}
                        >
                            {notes.length > 0 ? (
                                getCurrentNotes().map((note) => (
                                    <div
                                        key={note.id}
                                        className={`rounded-xl ${note.color} transform border border-gray-200/50 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 dark:border-gray-700/50 ${animated.includes(note.id) ? 'scale-0 opacity-0' : 'scale-100 opacity-100'} hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10`}
                                    >
                                        <div className="mb-3 flex items-center justify-between">
                                            <span className="rounded-full bg-gray-200/60 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800/40 dark:text-gray-300">
                                                {note.createdAt}
                                            </span>
                                            <div className="flex gap-2">
                                                {/* Edit Button */}
                                                {editingNote !== note.id && (
                                                    <button
                                                        onClick={() => handleStartEdit(note)}
                                                        className="text-gray-500 transition-colors duration-200 hover:text-blue-500 focus:outline-none dark:text-gray-400 dark:hover:text-blue-400"
                                                        aria-label="Edit note"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="h-5 w-5"
                                                            viewBox="0 0 20 20"
                                                            fill="currentColor"
                                                        >
                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                    </button>
                                                )}

                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => handleDeleteNote(note.id)}
                                                    className="text-gray-500 transition-colors duration-200 hover:text-red-500 focus:outline-none dark:text-gray-400 dark:hover:text-red-400"
                                                    aria-label="Delete note"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Note Content - Edit Mode or Display Mode */}
                                        {editingNote === note.id ? (
                                            <div className="mt-2">
                                                <textarea
                                                    ref={editInputRef}
                                                    className="w-full resize-none rounded-lg border border-gray-300 bg-white/90 p-3 text-gray-800 transition-all duration-200 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800/80 dark:text-white"
                                                    rows={5}
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    onKeyDown={handleEditKeyPress}
                                                />
                                                <div className="mt-3 flex justify-end space-x-2">
                                                    <button
                                                        className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 transition-colors duration-200 hover:bg-gray-200 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                                        onClick={handleCancelEdit}
                                                    >
                                                        Batal
                                                    </button>
                                                    <button
                                                        className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1 text-sm font-medium text-white transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 focus:outline-none"
                                                        onClick={handleSaveEdit}
                                                    >
                                                        Simpan
                                                    </button>
                                                </div>
                                                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    <span>Tip: Ctrl+Enter untuk menyimpan</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="mt-2 text-base leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-100">
                                                    {truncateContent(note.content, note.expanded)}
                                                </p>

                                                {/* Read More / Show Less toggle */}
                                                {needsTruncation(note.content) && (
                                                    <button
                                                        onClick={() => toggleExpand(note.id)}
                                                        className="mt-2 text-sm font-medium text-blue-600 transition-colors duration-200 hover:text-blue-800 focus:outline-none dark:text-blue-400 dark:hover:text-blue-300"
                                                    >
                                                        {note.expanded ? 'Tampilkan lebih sedikit' : 'Baca selengkapnya'}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full flex min-h-[40vh] flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="mb-4 h-16 w-16 animate-pulse text-gray-400 dark:text-gray-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1}
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                    </svg>
                                    <p className="mb-2 text-xl">Belum ada catatan</p>
                                    <p className="max-w-xs">Klik tombol "Catatan Baru" untuk mulai membuat catatan pertama Anda</p>
                                    <button
                                        onClick={() => setIsAdding(true)}
                                        className="mt-6 flex items-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 focus:outline-none"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                fillRule="evenodd"
                                                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Catatan Baru
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {notes.length > NOTES_PER_PAGE && renderPaginationButtons()}

                        {/* Page indicator */}
                        {totalPages > 1 && (
                            <div className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
                                Halaman {currentPage} dari {totalPages}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </AppLayoutStaffAdmin>
    );
}