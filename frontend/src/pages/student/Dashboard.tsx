import { useState, useEffect } from 'react';
import { studentApi } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Spinner } from '../../components/ui/spinner';
import { Badge } from '../../components/ui/badge';
import type { Student } from '../../types';
import { User, GraduationCap, Calendar, BookOpen, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const [profile, setProfile] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await studentApi.getProfile();
        setProfile(response.data.data);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6" data-testid="student-dashboard">
      <div>
        <h1 className="text-2xl font-bold">Student Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {profile?.user?.name}!</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Roll Number</CardTitle>
            <User className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.rollNumber || 'N/A'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Course</CardTitle>
            <GraduationCap className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{profile?.course?.name || 'N/A'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Semester</CardTitle>
            <BookOpen className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.semester || '-'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Section</CardTitle>
            <Calendar className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.section || '-'}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{profile?.user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{profile?.user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Department</span>
              <span className="font-medium">{profile?.department?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Academic Year</span>
              <span className="font-medium">{profile?.academicYear}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link to="/student/attendance">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 cursor-pointer">
                <Calendar className="h-5 w-5" />
                <div>
                  <div className="font-medium">View Attendance</div>
                  <div className="text-sm opacity-75">Check your attendance summary</div>
                </div>
              </div>
            </Link>
            <Link to="/student/marks">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 cursor-pointer">
                <Award className="h-5 w-5" />
                <div>
                  <div className="font-medium">View Marks</div>
                  <div className="text-sm opacity-75">Check your exam scores</div>
                </div>
              </div>
            </Link>
            <Link to="/student/materials">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 cursor-pointer">
                <BookOpen className="h-5 w-5" />
                <div>
                  <div className="font-medium">Study Materials</div>
                  <div className="text-sm opacity-75">Download course materials</div>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
