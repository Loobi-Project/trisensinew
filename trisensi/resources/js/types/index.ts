import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth  & { dashboardRoute?: string };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    role?: {
        name: string;
    };
    [key: string]: unknown; 
}

export interface PageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
        };
    };
    hadir: number;
    izin: number;
    sakit: number;
    alfa: number;
    todayStatus: {
        presence_status?: {
            name: string;
        };
        timestamp: string;
    } | null;
    student: {
        name: string;
        classroom?: {
            name: string;
        };
    };
    activeSemester: {
        name: string;
    };
    [key: string]: unknown;
}
