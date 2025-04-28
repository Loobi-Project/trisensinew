import AppLayoutStaffAdmin from '@/layouts/staffadmin/app-layout-staffadmin';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard Staff Admin',
        href: '/staffadmin/dashboard',
    },
    {
        title: 'Konfirmasi Siswa',
        href: '/staffadmin/student',
    },
];

export default function StudentConfirmation() {
    return (
        <AppLayoutStaffAdmin breadcrumbs={breadcrumbs}>
            <Head title="Siswa - Tata Usaha" />
            <div className="flex">
                <main className="min-h-screen flex-1 p-5">
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative mt-4 min-h-[100vh] flex-1 overflow-hidden rounded-xl border bg-gray-900 p-6 text-white md:min-h-min">
                        {/* Tempat konten data atau form */}
                        <div className="space-y-3 text-gray-300">
                            <p>Halaman ini sedang dalam masa pengembangan</p>
                        </div>
                    </div>
                </main>
            </div>
        </AppLayoutStaffAdmin>
    );
}
