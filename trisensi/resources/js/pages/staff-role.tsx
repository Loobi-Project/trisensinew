import AuthLayout from '@/layouts/auth-layout';
import { Head, Link } from '@inertiajs/react';

export default function Login({ status }: { status?: string }) {
    return (
        <AuthLayout title="Masuk sesuai staff yang tersedia" description="Pilih peran untuk melanjutkan">
            <Head title="Login" />
            <div className="flex flex-col items-center justify-center min-h-[60vh] w-full px-4 py-8">
                {/* Card Pilihan */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md w-full max-w-md mx-auto">
                    {/* Menggunakan grid untuk layout yang lebih konsisten di semua ukuran */}
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Link
                                href={route('staffteacher.login')}
                                className="flex items-center justify-center px-4 py-3 rounded-lg
                                         text-blue-600 dark:text-blue-400 border border-blue-500 dark:border-blue-400
                                         bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600
                                         transition duration-300 ease-in-out"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Guru
                            </Link>
                           
                            <Link
                                href={route('staffadmin.login')}
                                className="flex items-center justify-center px-4 py-3 rounded-lg
                                         text-purple-600 dark:text-purple-400 border border-purple-500 dark:border-purple-400
                                         bg-white dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-gray-600
                                         transition duration-300 ease-in-out"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                Tata Usaha
                            </Link>
                        </div>
                    </div>
                </div>
               
                {status && (
                    <div className="mt-4 py-2 px-4 rounded-md bg-green-50 dark:bg-green-900/30 text-center text-sm font-medium text-green-600 dark:text-green-400 w-full max-w-md">
                        {status}
                    </div>
                )}
            </div>
        </AuthLayout>
    );
}
