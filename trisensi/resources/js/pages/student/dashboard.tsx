import AppLayoutStudent from '@/layouts/student/app-layout-student';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard Staff Admin',
        href: '/staffadmin/dashboard',
    },
];
export default function Dashboard() {
    return (
        <AppLayoutStudent breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - Tata Usaha" />
            <div className="flex">
                <main className="min-h-screen flex-1 p-5">
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative mt-4 min-h-[100vh] flex-1 overflow-hidden rounded-xl border bg-gray-900 p-6 text-white md:min-h-min">
                        <h2 className="text-xl font-bold">Recent Activities</h2>
                        <ul className="mt-2 text-gray-400">
                            <li>- John Doe added a new user</li>
                            <li>- Jane Smith updated transaction #1245</li>
                            <li>- System generated a monthly report</li>
                        </ul>
                    </div>
                </main>
            </div>
        </AppLayoutStudent>
    );
}