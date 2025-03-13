import AppLayoutSuperAdmin from '@/layouts/superadmin/app-layout-superadmin';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard Super Admin',
        href: '/superadmin/dashboard',
    },
];

type StatisticsBoxProps = {
    title: string;
    value: number;
    color: string;
};

function animateValue(element: HTMLParagraphElement | null, start: number, end: number, duration: number) {
    if (!element) return;
    let startTimestamp: number | null = null;
    
    // Using easeInOutQuint for an even smoother transition
    const easeInOutQuint = (t: number) => {
        return t < 0.5 
            ? 16 * t * t * t * t * t 
            : 1 - Math.pow(-2 * t + 2, 5) / 2;
    };
    
    const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
       
        const currentValue = start + (end - start) * easeInOutQuint(progress);
        element.innerText = Math.floor(currentValue).toString();
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

function StatisticsBox({ title, value, color }: StatisticsBoxProps) {
    const valueRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        animateValue(valueRef.current, 0, value, 1000);
    }, [value]);

    return (
        <div className="border-sidebar-border/70 dark:border-sidebar-border relative aspect-video overflow-hidden rounded-xl border bg-gray-800 p-6 text-white">
            <h3 className="text-lg font-semibold text-gray-300">{title}</h3>
            <p ref={valueRef} className={`text-3xl font-bold ${color}`}>
                0
            </p>
        </div>
    );
}

export default function Dashboard() {
    const [totalAdminStaff, setTotalAdminStaff] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/superadmin/adm/count-staff');
                setTotalAdminStaff(response.data.total || 0);
            } catch (error) {
                console.error('Error mengambil data tata usaha yang terhubung:', error);
            }
        };

        fetchData();
    }, []);

    return (
        <AppLayoutSuperAdmin breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - Super Admin" />
            <div className="flex">
                <main className="min-h-screen flex-1 p-5">
                    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                        <StatisticsBox title="Total Tata Usaha" value={totalAdminStaff} color="text-green-400" />
                        <StatisticsBox title="Total Guru" value={32} color="text-blue-400" />
                        <StatisticsBox title="Total Siswa" value={500} color="text-yellow-400" />
                    </div>
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
        </AppLayoutSuperAdmin>
    );
}
