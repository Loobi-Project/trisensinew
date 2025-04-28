import { Head, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function CountdownLogout() {
    const { post } = useForm();
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            setFadeOut(true);
            setTimeout(() => {
                post('logout');
            }, 1000); // Delay 1 detik untuk animasi keluar
        }, 1500); // Tampilkan pesan 1.5 detik sebelum logout
    }, []);

    return (
        <div
            className={`flex h-screen items-center justify-center transition-opacity duration-1000 ${fadeOut ? 'opacity-0' : 'opacity-100'} bg-gradient-to-br from-gray-900 to-gray-800 text-white`}
        >
            <Head title="Keluar Otomatis" />
            <div className="rounded-xl border border-gray-800 bg-gray-950 p-6 text-center shadow-2xl">
                <h1 className="text-4xl font-extrabold text-gray-100">Keluar Otomatis</h1>
                <p className="mt-2 text-lg text-gray-400">
                    Anda tidak memiliki akses ke halaman ini. <br /> Sistem akan mengeluarkan Anda...
                </p>
                <div className="mt-4 flex justify-center">
                    <div className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 font-mono text-lg font-extrabold text-gray-100 shadow-lg">
                        <svg className="h-6 w-6 animate-spin text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                            ></path>
                        </svg>
                        <span>Keluar...</span>
                    </div>
                </div>
            </div>
        </div>
    );
}