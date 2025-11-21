'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  GraduationCap,
  Users,
  Shield,
  Settings,
  BookOpen,
  ClipboardList,
  Calendar,
  FileText,
  LogOut,
  Menu,
  LayoutDashboard,
  UserCog,
  Database,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Bell,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, resource: null },
  { name: 'Users', href: '/dashboard/users', icon: Users, resource: 'users' },
  { name: 'Roles', href: '/dashboard/roles', icon: Shield, resource: 'roles' },
  { name: 'Permissions', href: '/dashboard/permissions', icon: UserCog, resource: 'permissions' },
  { name: 'Dynamic Fields', href: '/dashboard/fields', icon: Database, resource: 'fields' },
  { name: 'Classes', href: '/dashboard/classes', icon: BookOpen, resource: 'classes' },
  { name: 'Subjects', href: '/dashboard/subjects', icon: FileText, resource: 'subjects' },
  { name: 'Marks', href: '/dashboard/marks', icon: ClipboardList, resource: 'marks' },
  { name: 'Attendance', href: '/dashboard/attendance', icon: Calendar, resource: 'attendance' },
];

const timetableNavigation = [
  { name: 'Generate Timetable', href: '/dashboard/timetable/generate', icon: CalendarDays },
  { name: 'Rooms', href: '/dashboard/timetable/rooms', icon: BookOpen },
  { name: 'Period Templates', href: '/dashboard/timetable/period-templates', icon: Calendar },
  { name: 'Teaching Assignments', href: '/dashboard/timetable/assignments', icon: Users },
  { name: 'Availability', href: '/dashboard/timetable/availability', icon: ClipboardList },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut, can } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState) {
        setSidebarCollapsed(JSON.parse(savedState));
      }
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-8 w-48" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const visibleNavItems = navigation.filter(
    (item) => !item.resource || can(item.resource, 'view')
  );

  const canViewTimetable = can('timetable', 'view');

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? '' : 'border-r bg-[#1a1f37]'}`}>
      <div className={`p-4 border-b border-slate-700 flex items-center ${sidebarCollapsed && !mobile ? 'justify-center' : 'justify-between'}`}>
        <div className={`flex items-center ${sidebarCollapsed && !mobile ? 'space-x-0' : 'space-x-3'}`}>
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          {(!sidebarCollapsed || mobile) && (
            <div>
              <h1 className="text-xl font-bold text-white">ERP Dashboard</h1>
              <p className="text-xs text-slate-400">Institute Management</p>
            </div>
          )}
        </div>
        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-slate-400 hover:text-white hover:bg-slate-700"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => mobile && setMobileMenuOpen(false)}
              className={`flex items-center ${sidebarCollapsed && !mobile ? 'justify-center px-3' : 'space-x-3 px-4'} py-3 rounded-lg transition-colors group relative ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              title={sidebarCollapsed && !mobile ? item.name : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {(!sidebarCollapsed || mobile) && <span className="font-medium">{item.name}</span>}
            </Link>
          );
        })}

        {canViewTimetable && (
          <>
            {(!sidebarCollapsed || mobile) && (
              <div className="px-4 py-2 mt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Timetable Module
                </p>
              </div>
            )}
            {timetableNavigation.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => mobile && setMobileMenuOpen(false)}
                  className={`flex items-center ${sidebarCollapsed && !mobile ? 'justify-center px-3' : 'space-x-3 px-4'} py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                  title={sidebarCollapsed && !mobile ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {(!sidebarCollapsed || mobile) && <span className="font-medium">{item.name}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-700">
        {(!sidebarCollapsed || mobile) ? (
          <>
            <div className="flex items-center space-x-3 mb-4 p-3 rounded-lg bg-slate-800 border border-slate-700">
              <Avatar>
                <AvatarFallback className="bg-blue-600 text-white">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.full_name}
                </p>
                <p className="text-xs text-slate-400 truncate">{user.role.role_name}</p>
                <p className="text-xs text-slate-500">{user.unique_id}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <Avatar>
              <AvatarFallback className="bg-blue-600 text-white">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white hover:bg-slate-700"
              onClick={signOut}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      <aside className={`hidden md:block transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-72'}`}>
        <Sidebar />
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="md:hidden border-b bg-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold">TIMES ERP</h1>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <Sidebar mobile />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 overflow-auto bg-slate-50">
          <div className="border-b bg-white px-6 py-4 hidden md:flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
              <p className="text-sm text-slate-500">Administrator Dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5 text-slate-600" />
              </Button>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
