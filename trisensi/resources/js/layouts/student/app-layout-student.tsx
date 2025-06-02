import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout-student';
import { type BreadcrumbItem } from '@/types';
import axios from 'axios';
import { useEffect, useState, type ReactNode } from 'react';
import { router } from '@inertiajs/react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
    const [showActivatedModal, setShowActivatedModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Check activation status on component mount
    useEffect(() => {
        const checkUserStatus = async () => {
            try {
                console.log("Checking student activation status...");
                const response = await axios.get('/student/get-detect-is-active-student');
                console.log("Student activation check response:", response.data);
                
                // Check if student is not active (0 or "0")
                if (response.data && (response.data.is_active === 0 || response.data.is_active === "0")) {
                    console.log("Student is not active, showing activation modal");
                    setShowActivatedModal(true);
                } else {
                    console.log("Student is active, modal should be closed");
                    setShowActivatedModal(false);
                }
            } catch (error) {
                console.error('Failed to retrieve student activation status:', error);
            }
        };

        checkUserStatus();
    }, []);

    const handleLogout = () => {
        setLoading(true);
        router.post('/logout');
    };

    return (
        <div className="relative">
            <div className={`transition-all duration-300 ${showActivatedModal ? 'blur-lg' : ''}`}>
                <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
                    {children}
                </AppLayoutTemplate>
            </div>

            {showActivatedModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur dark:bg-black/30">
                    <div className="w-[400px] rounded-xl border border-gray-300 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                                <svg 
                                    className="h-8 w-8 text-yellow-600 dark:text-yellow-400" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
                                    />
                                </svg>
                            </div>
                            
                            <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                                Akun Belum Aktif
                            </h2>
                            
                            <div className="mb-6 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                <p>
                                    Akun Anda sudah berhasil didaftarkan tetapi belum diaktifkan.
                                </p>
                                <p>
                                    Silakan menunggu konfirmasi aktivasi dari <strong>Tata Usaha</strong>.
                                </p>
                                <p>
                                    Jika sudah terlalu lama menunggu, silakan hubungi Tata Usaha secara langsung.
                                </p>
                            </div>
                            
                            <button 
                                onClick={handleLogout}
                                disabled={loading}
                                className={`w-full rounded-lg py-2.5 px-4 text-white transition duration-200 ${
                                    loading 
                                        ? 'bg-gray-500 cursor-not-allowed' 
                                        : 'bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800'
                                }`}
                            >
                                {loading ? 'Keluar...' : 'Keluar dari Akun'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};