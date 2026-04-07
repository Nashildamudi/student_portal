import { useState, useEffect } from 'react';
import { facultyApi } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Spinner } from '../../components/ui/spinner';
import { Badge } from '../../components/ui/badge';
import type { TeachingAssignment } from '../../types';
import { BookOpen, Users, Calendar, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FacultyDashboard() {
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await facultyApi.getAssignments();
        setAssignments(response.data.data);
      } catch (err) {
        console.error('Failed to fetch assignments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6" data-testid="faculty-dashboard">
      <div>
        <h1 className="text-2xl font-bold">Faculty Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your teaching overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">My Classes</CardTitle>
            <BookOpen className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{assignments.length}</div>
          </CardContent>
        </Card>

        <Link to="/faculty/attendance">
          <Card className="hover:border-primary cursor-pointer transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Attendance</CardTitle>
              <Calendar className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-primary">Mark Attendance →</div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/faculty/marks">
          <Card className="hover:border-primary cursor-pointer transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Marks</CardTitle>
              <Award className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-primary">Enter Marks →</div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/faculty/materials">
          <Card className="hover:border-primary cursor-pointer transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Materials</CardTitle>
              <Users className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-primary">Upload Materials →</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Teaching Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No teaching assignments found.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assignments.map((assignment) => (
                <Card key={assignment._id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{assignment.subject?.name}</h3>
                    <p className="text-sm text-muted-foreground">{assignment.subject?.code}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary">{assignment.course?.name}</Badge>
                      <Badge variant="outline">Sem {assignment.semester}</Badge>
                      <Badge variant="outline">Sec {assignment.section}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{assignment.academicYear}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
