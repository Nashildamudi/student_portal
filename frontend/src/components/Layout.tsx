import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import {
  LayoutDashboard,
  Users,
  Building2,
  BookOpen,
  FileText,
  GraduationCap,
  UserCog,
  ClipboardList,
  Calendar,
  Award,
  FolderOpen,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Users', href: '/admin/users', icon: <Users className="h-5 w-5" /> },
  { label: 'Departments', href: '/admin/departments', icon: <Building2 className="h-5 w-5" /> },
  { label: 'Courses', href: '/admin/courses', icon: <BookOpen className="h-5 w-5" /> },
  { label: 'Subjects', href: '/admin/subjects', icon: <FileText className="h-5 w-5" /> },
  { label: 'Students', href: '/admin/students', icon: <GraduationCap className="h-5 w-5" /> },
  { label: 'Faculty', href: '/admin/faculty', icon: <UserCog className="h-5 w-5" /> },
  { label: 'Assignments', href: '/admin/assignments', icon: <ClipboardList className="h-5 w-5" /> },
];

const facultyNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/faculty', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'My Classes', href: '/faculty/classes', icon: <BookOpen className="h-5 w-5" /> },
  { label: 'Attendance', href: '/faculty/attendance', icon: <Calendar className="h-5 w-5" /> },
  { label: 'Marks', href: '/faculty/marks', icon: <Award className="h-5 w-5" /> },
  { label: 'Materials', href: '/faculty/materials', icon: <FolderOpen className="h-5 w-5" /> },
];

const studentNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/student', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Attendance', href: '/student/attendance', icon: <Calendar className="h-5 w-5" /> },
  { label: 'Marks', href: '/student/marks', icon: <Award className="h-5 w-5" /> },
  { label: 'Materials', href: '/student/materials', icon: <FolderOpen className="h-5 w-5" /> },
];

export function DashboardLayout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems = user?.role === 'admin' 
    ? adminNavItems 
    : user?.role === 'faculty' 
    ? facultyNavItems 
    : studentNavItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColors = {
    admin: 'bg-purple-600',
    faculty: 'bg-blue-600',
    student: 'bg-green-600',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="font-bold text-lg">Student Portal</span>
          </Link>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4">
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1" />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-100"
            >
              <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-white", roleColors[user?.role || 'student'])}>
                <User className="h-4 w-4" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border bg-white shadow-lg py-1">
                <div className="px-4 py-2 border-b">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
