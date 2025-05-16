import { NavFooter } from '@/components/nav-footer';
import { NavUserStudent } from '@/components/student/nav-user-student';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, CalendarCheck, ChevronDown, ChevronUp, FileText, LayoutGrid} from 'lucide-react';
import { useState } from 'react';
import AppLogo from '../app-logo';

// Extended types to support dropdown structure
interface DropdownNavItem {
    title: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    children: NavItem[];
    isOpen?: boolean;
}

type SidebarNavItem = NavItem | DropdownNavItem;

// Helper function to check if an item is a dropdown
const isDropdownItem = (item: SidebarNavItem): item is DropdownNavItem => {
    return 'children' in item;
};

const mainNavItems: SidebarNavItem[] = [
    {
        title: 'Dashboard',
        url: route('student.dashboard'),
        icon: LayoutGrid,
    },
    
    {
        title: 'Mulai Absen',
        url : route('student.create-presence'),
        icon: CalendarCheck,
    },
    {
        title: 'Format Surat',
        url: route('student.select-letter-absence'),
        icon: FileText,
    }
    
];

const footerNavItems: NavItem[] = [
    {
        title: 'Documentation',
        url: '#',
        icon: BookOpen,
    },
];

export function StudentSidebar() {
    const [navItems, setNavItems] = useState<SidebarNavItem[]>(mainNavItems);

    const toggleDropdown = (index: number) => {
        const updatedNavItems = [...navItems];
        if (isDropdownItem(updatedNavItems[index])) {
            updatedNavItems[index] = {
                ...(updatedNavItems[index] as DropdownNavItem),
                isOpen: !(updatedNavItems[index] as DropdownNavItem).isOpen,
            };
            setNavItems(updatedNavItems);
        }
    };

    const iconClass = "h-4 w-4";
    const titleClass = "ml-4 text-sm text-gray-700 dark:text-gray-300"; 
    const regularItemClass = "flex items-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md px-3 py-2";
    const dropdownParentClass = "flex items-center justify-between w-full text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-800 rounded-md px-3 py-2";

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/student/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {navItems.map((item, index) => (
                        <div key={item.title}>
                            {isDropdownItem(item) ? (
                                <>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton className={dropdownParentClass} onClick={() => toggleDropdown(index)}>
                                            <div className="flex items-center">
                                                {item.icon && (
                                                    <div className="flex w-5 flex-shrink-0 justify-center">
                                                        <item.icon className={iconClass} />
                                                    </div>
                                                )}
                                                <span className={titleClass}>{item.title}</span>
                                            </div>
                                            <div className="flex-shrink-0">
                                                {item.isOpen ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                                            </div>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    
                                    {item.isOpen &&
                                        item.children.map((child) => (
                                            <SidebarMenuItem key={child.title}>
                                                <SidebarMenuButton asChild>
                                                    <Link href={child.url} prefetch className={regularItemClass + " pl-10"}>
                                                        <div className="flex w-5 flex-shrink-0 justify-center">
                                                            {child.icon && <child.icon className={iconClass} />}
                                                        </div>
                                                        <span className={titleClass}>{child.title}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))}
                                </>
                            ) : (
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link href={item.url} prefetch className={regularItemClass}>
                                            <div className="flex w-5 flex-shrink-0 justify-center">
                                                {item.icon && <item.icon className={iconClass} />}
                                            </div>
                                            <span className="ml-2">{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                        </div>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUserStudent />
            </SidebarFooter>
        </Sidebar>
    );
}