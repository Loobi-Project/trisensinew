import AuthLayout from '@/layouts/auth-layout';
import { Head, Link } from '@inertiajs/react';

export default function Login({ status }: { status?: string }) {
    return (
        <AuthLayout title="Masuk sebagai Guru atau Tata Usaha" description="Pilih peran untuk melanjutkan">
            <Head title="Login" />

            <div className="flex flex-col items-center space-y-4 mt-6">
                <h2 className="text-xl font-semibold">Pilih Peran</h2>

                <div className="flex space-x-4">
                    <a href="#" 
                        className="btn btn-primary transition duration-300 ease-in-out transform hover:scale-105 active:scale-95">
                        Masuk sebagai Guru
                    </a>
                    
                    <Link 
                        href={route('staffadmin.login')} 
                        className="btn btn-secondary transition duration-300 ease-in-out transform hover:scale-105 active:scale-95">
                        Masuk sebagai Tata Usaha
                    </Link>
                </div>

                {status && <div className="mt-4 text-center text-sm font-medium text-green-600">{status}</div>}
            </div>
        </AuthLayout>
    );
}
