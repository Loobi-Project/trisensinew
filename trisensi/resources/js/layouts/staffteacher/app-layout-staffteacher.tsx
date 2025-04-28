import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout-staffteacher';
import { type BreadcrumbItem } from '@/types';
import axios from 'axios';
import { useEffect, useState, type ReactNode } from 'react';

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

    // const [showPasswordModal, setShowPasswordModal] = useState(false);
    // const [password, setPassword] = useState('');
    // const [passwordConfirmation, setPasswordConfirmation] = useState('');
    // const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
    // const [passwordError, setPasswordError] = useState<string | null>(null);
    // const [passwordLoading, setPasswordLoading] = useState(false);

    const [showActivatedModal, setShowActivatedModal] = useState(false);
    const [isDataProcessComplete, setIsDataProcessComplete] = useState(false);

    useEffect(() => {
        const checkUserStatus = async () => {
            try {
                const response = await axios.get('/staffteacher/get-detect-nip-nuptk-staffteacher');
                if (!response.data.is_complete) {
                    setShowModal(true);
                } else {
                    checkIsActive();
                }
            } catch (error) {
                console.error('Gagal mengambil data NIP/NUPTK', error);
            }
        };

        checkUserStatus();
    }, []);  

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
            const response = await axios.post('/staffteacher/update-nip-nuptk-staffteacher', { nip, nuptk });

            if (response.data?.success) {
                setSuccess('Data berhasil disimpan!');

                setTimeout(() => {
                    setShowModal(false);
                    setIsDataProcessComplete(true); 
                    // setShowPasswordModal(true);
                }, 1500);
            } else {
                setError(response.data?.error || 'Terjadi kesalahan yang tidak diketahui.');
            }
        } catch (error: any) {
            setError(error.response?.data?.error || 'Terjadi kesalahan saat menyimpan data.');
        } finally {
            setLoading(false);
        }
    };
    
    // Hanya periksa aktivasi setelah proses data selesai
    useEffect(() => {
        if (isDataProcessComplete) {
            checkIsActive();
        }
    }, [isDataProcessComplete]);
    
    const checkIsActive = async () => {
        try {
            const res = await fetch('/staffteacher/get-detect-is-active-teacher');
            const data = await res.json();
    
            if (data.is_active === 0) {
                // Tutup modal lain jika masih terbuka
                setShowModal(false);
                // setShowPasswordModal(false);
                setShowActivatedModal(true);
            } else {
                // Jika sudah aktif, bersihkan status di localStorage
                // Ini opsional, tergantung apakah Anda ingin reset status jika user sudah aktif
                // localStorage.removeItem('passwordUpdated');
            }
        } catch (err) {
            console.error('Gagal mengambil data status:', err);
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
                    </div>
                </div>
            )}
        </div>
    );
};
