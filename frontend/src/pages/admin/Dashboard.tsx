import { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Spinner } from '../../components/ui/spinner';
import type { DashboardStats } from '../../types';
import { Users, GraduationCap, Building2, BookOpen, FileText, ClipboardList } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminApi.getStats();
        setStats(response.data.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const statCards = [
    { label: 'Students', value: stats?.students || 0, icon: GraduationCap, color: 'bg-green-500' },
    { label: 'Faculty', value: stats?.faculty || 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Departments', value: stats?.departments || 0, icon: Building2, color: 'bg-purple-500' },
    { label: 'Courses', value: stats?.courses || 0, icon: BookOpen, color: 'bg-orange-500' },
    { label: 'Subjects', value: stats?.subjects || 0, icon: FileText, color: 'bg-pink-500' },
    { label: 'Assignments', value: stats?.assignments || 0, icon: ClipboardList, color: 'bg-cyan-500' },
  ];

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of the student portal</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.label} data-testid={`stat-${stat.label.toLowerCase()}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className={`${stat.color} p-2 rounded-lg`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <a href="/admin/students" className="flex items-center gap-2 p-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-700">
              <GraduationCap className="h-5 w-5" />
              Add New Student
            </a>
            <a href="/admin/faculty" className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700">
              <Users className="h-5 w-5" />
              Add New Faculty
            </a>
            <a href="/admin/assignments" className="flex items-center gap-2 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700">
              <ClipboardList className="h-5 w-5" />
              Create Teaching Assignment
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <span className="flex items-center gap-1 text-green-600">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Server</span>
                <span className="flex items-center gap-1 text-green-600">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  Running
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Updated</span>
                <span className="text-sm text-muted-foreground">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
