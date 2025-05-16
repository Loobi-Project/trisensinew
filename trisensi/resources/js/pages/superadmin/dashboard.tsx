import AppLayoutSuperAdmin from '@/layouts/superadmin/app-layout-superadmin';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
ChartJS.register(ArcElement, Tooltip, Legend);

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
    isLoading?: boolean;
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

function StatisticsBox({ title, value, color, isLoading = false }: StatisticsBoxProps) {
    const valueRef = useRef(null);
   
    useEffect(() => {
        if (!isLoading) {
            animateValue(valueRef.current, 0, value, 1000);
        }
    }, [value, isLoading]);
   
    return (
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 flex flex-col h-full">
            <h3 className="text-gray-500 text-sm md:text-base font-medium mb-2">{title}</h3>
            {isLoading ? (
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
            ) : (
                <p 
                    ref={valueRef} 
                    className="text-2xl md:text-3xl font-bold" 
                    style={{ color }}
                >
                    0
                </p>
            )}
        </div>
    );
}

interface PageProps {
    totalAdminStaff?: number;
    totalTeachers?: number;
    totalStudents?: number;
}

export default function Dashboard({ totalAdminStaff = 0, totalTeachers = 0, totalStudents = 0 }: PageProps) {
    const [staffCount, setStaffCount] = useState(totalAdminStaff);
    const [teacherCount, setTeacherCount] = useState(totalTeachers);
    const [studentCount, setStudentCount] = useState(totalStudents);
   
    const [isLoading, setIsLoading] = useState({
        staff: totalAdminStaff === 0,
        teachers: totalTeachers === 0,
        students: totalStudents === 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Mengambil data tata usaha jika belum ada
                if (totalAdminStaff === 0) {
                    const staffResponse = await axios.get('/superadmin/spadm/count-staff');
                    setStaffCount(staffResponse.data.total || 0);
                    setIsLoading(prev => ({ ...prev, staff: false }));
                }
               
                // Mengambil data guru jika belum ada
                if (totalTeachers === 0) {
                    const teacherResponse = await axios.get('/superadmin/spadm/count-teachers');
                    setTeacherCount(teacherResponse.data.total || 0);
                    setIsLoading(prev => ({ ...prev, teachers: false }));
                }
               
                // Mengambil data siswa jika belum ada
                if (totalStudents === 0) {
                    const studentResponse = await axios.get('/superadmin/spadm/count-students');
                    setStudentCount(studentResponse.data.total || 0);
                    setIsLoading(prev => ({ ...prev, students: false }));
                }
            } catch (error) {
                console.error('Error mengambil data dashboard:', error);
                setIsLoading({ staff: false, teachers: false, students: false });
            }
        };
       
        fetchData();
    }, [totalAdminStaff, totalTeachers, totalStudents]);

    const chartData = {
        labels: ['Tata Usaha', 'Guru', 'Siswa'],
        datasets: [
            {
                data: [staffCount, teacherCount, studentCount],
                backgroundColor: ['#10B981', '#3B82F6', '#F59E0B'],
                hoverBackgroundColor: ['#059669', '#2563EB', '#D97706'],
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    boxWidth: 12,
                    padding: 15,
                    font: {
                        size: 12
                    }
                }
            }
        }
    };

    return (
        <AppLayoutSuperAdmin
            title="Dashboard"
            breadcrumbs={breadcrumbs}
        >
            <Head title="Dashboard Super Admin" />

            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                    <StatisticsBox 
                        title="Total Tata Usaha" 
                        value={staffCount} 
                        color="#10B981" 
                        isLoading={isLoading.staff} 
                    />
                    <StatisticsBox 
                        title="Total Guru" 
                        value={teacherCount} 
                        color="#3B82F6" 
                        isLoading={isLoading.teachers} 
                    />
                    <StatisticsBox 
                        title="Total Siswa" 
                        value={studentCount} 
                        color="#F59E0B" 
                        isLoading={isLoading.students} 
                    />
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-medium text-gray-700 mb-4">
                        Distribusi Data
                    </h3>
                    <div className="h-64 md:h-80 w-full">
                        <Doughnut 
                            data={chartData} 
                            options={chartOptions}
                        />
                    </div>
                </div>
            </div>
        </AppLayoutSuperAdmin>
    );
}