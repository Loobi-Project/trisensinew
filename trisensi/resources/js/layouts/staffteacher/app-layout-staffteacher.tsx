import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout-staffteacher';
import { type BreadcrumbItem } from '@/types';
import axios from 'axios';
import { useEffect, useState, type ReactNode } from 'react';
import { router } from '@inertiajs/react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
    const [showModal, setShowModal] = useState(false);
    const [nip, setNip] = useState('');
    const [nuptk, setNuptk] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [showActivatedModal, setShowActivatedModal] = useState(false);
    const [isDataProcessComplete, setIsDataProcessComplete] = useState(false);

    // Initial check for NIP/NUPTK data
    useEffect(() => {
        const checkUserStatus = async () => {
            try {
                console.log("Checking user NIP/NUPTK status...");
                const response = await axios.get('/staffteacher/get-detect-nip-nuptk-staffteacher');
                console.log("NIP/NUPTK check response:", response.data);
                
                if (!response.data.is_complete) {
                    console.log("NIP/NUPTK data incomplete, showing form modal");
                    setShowModal(true);
                    setShowActivatedModal(false); // Ensure activation modal is closed
                } else {
                    console.log("NIP/NUPTK data complete, checking activation status");
                    setIsDataProcessComplete(true);
                    await checkIsActive(); // Important: await the check
                }
            } catch (error) {
                console.error('Failed to retrieve NIP/NUPTK data', error);
            }
        };

        checkUserStatus();
    }, []);

    // Separate effect for activation check when data process completes
    useEffect(() => {
        if (isDataProcessComplete) {
            console.log("Data process complete flag changed, checking activation status");
            checkIsActive();
        }
    }, [isDataProcessComplete]);

    const checkIsActive = async () => {
        try {
            console.log("Checking if user is active...");
            // Use axios consistently instead of mixing fetch and axios
            const response = await axios.get('/staffteacher/get-detect-is-active-teacher');
            console.log("Active status check response:", response.data);

            // Fix: Compare with string "0" or convert both to the same type
            if (response.data && (response.data.is_active === 0 || response.data.is_active === "0")) {
                console.log("User is not active, showing activation modal");
                setShowModal(false); // Close any other modals
                setShowActivatedModal(true);
            } else {
                console.log("User is active, all modals should be closed");
                setShowActivatedModal(false);
            }
        } catch (err) {
            console.error('Failed to retrieve activation status:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        if (nip.trim() === '' || nuptk.trim() === '') {
            setError('NIP dan NUPTK tidak boleh kosong.');
            setLoading(false);
            return;
        }

        if (!/^\d{18}$/.test(nip)) {
            setError('NIP harus terdiri dari 18 digit angka.');
            setLoading(false);
            return;
        }

        if (!/^\d{16}$/.test(nuptk)) {
            setError('NUPTK harus terdiri dari 16 digit angka.');
            setLoading(false);
            return;
        }

        try {
            console.log("Submitting NIP/NUPTK data...");
            const response = await axios.post('/staffteacher/update-nip-nuptk-staffteacher', { nip, nuptk });
            console.log("NIP/NUPTK submission response:", response.data);

            if (response.data?.success) {
                setSuccess('Data berhasil disimpan!');

                setTimeout(() => {
                    setShowModal(false);
                    setIsDataProcessComplete(true);
                    console.log("NIP/NUPTK data saved, marking process complete");
                }, 1500);
            } else {
                setError(response.data?.error || 'Terjadi kesalahan yang tidak diketahui.');
            }
        } catch (error: any) {
            console.error("Error submitting NIP/NUPTK data:", error);
            setError(error.response?.data?.error || 'Terjadi kesalahan saat menyimpan data.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            <div className={`transition-all duration-300 ${showModal || showActivatedModal ? 'blur-lg' : ''}`}>
                <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
                    {children}
                </AppLayoutTemplate>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur dark:bg-black/30">
                    <div className="w-[350px] rounded-xl border border-gray-300 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
                        <h2 className="text-center text-xl font-semibold text-gray-900 dark:text-white">Lengkapi Identitas Anda</h2>
                        <p className="mb-4 text-center text-sm text-gray-600 dark:text-gray-300">Isi detail identitas Anda untuk melanjutkan</p>

                        {error && <p className="mb-2 text-center text-sm text-red-500">{error}</p>}
                        {success && <p className="mb-2 text-center text-sm text-green-500">{success}</p>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">NIP</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-lg border border-gray-400 bg-gray-100 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                                    value={nip}
                                    onChange={(e) => {
                                        setNip(e.target.value);
                                        setError(null);
                                    }}
                                    placeholder="Masukkan 18 digit NIP"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">NUPTK</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-lg border border-gray-400 bg-gray-100 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                                    value={nuptk}
                                    onChange={(e) => {
                                        setNuptk(e.target.value);
                                        setError(null);
                                    }}
                                    placeholder="Masukkan 16 digit NUPTK"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className={`w-full rounded-lg py-2 text-white transition duration-200 ${loading ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                                disabled={loading}
                            >
                                {loading ? 'Menyimpan...' : 'Submit'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showActivatedModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur dark:bg-black/30">
                    <div className="w-[350px] rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
                        <h2 className="text-center text-lg font-semibold text-gray-900 dark:text-white">Akun Belum Aktif</h2>
                        <p className="text-center text-sm text-gray-600 dark:text-gray-300">
                            Akun Anda sudah didaftarkan. Silakan menunggu konfirmasi dari Tata Usaha. Jika terlalu lama, silakan hubungi mereka secara
                            langsung.
                        </p>
                        <div className="mt-4 text-center">
                            <button onClick={() => router.post('/logout')} className="text-blue-500 hover:underline">
                                Keluar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};