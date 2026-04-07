import { useState, useEffect } from 'react';
import { facultyApi } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Spinner } from '../../components/ui/spinner';
import { Badge } from '../../components/ui/badge';
import type { TeachingAssignment } from '../../types';
import { Calendar, Check, X, Clock, Stethoscope, Save } from 'lucide-react';

interface StudentForAttendance {
  _id: string;
  rollNumber: string;
  name: string;
  email: string;
}

export default function AttendancePage() {
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [students, setStudents] = useState<StudentForAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState('morning');
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await facultyApi.getAssignments();
        setAssignments(response.data.data);
      } catch (err) {
        console.error('Failed to fetch assignments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (!selectedAssignment) return;
    
    const fetchStudents = async () => {
      try {
        const response = await facultyApi.getStudentsForAssignment(selectedAssignment);
        setStudents(response.data.data);
        // Initialize all as present
        const initialAttendance: Record<string, string> = {};
        response.data.data.forEach((s: StudentForAttendance) => {
          initialAttendance[s._id] = 'present';
        });
        setAttendance(initialAttendance);
      } catch (err) {
        console.error('Failed to fetch students:', err);
      }
    };
    fetchStudents();
  }, [selectedAssignment]);

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    if (!selectedAssignment || Object.keys(attendance).length === 0) return;
    
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      await facultyApi.markAttendance({
        assignmentId: selectedAssignment,
        date,
        session,
        records,
      });

      setMessage({ type: 'success', text: 'Attendance marked successfully!' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to mark attendance' });
    } finally {
      setSubmitting(false);
    }
  };

  const statusOptions = [
    { value: 'present', label: 'Present', icon: Check, color: 'text-green-600' },
    { value: 'absent', label: 'Absent', icon: X, color: 'text-red-600' },
    { value: 'od', label: 'OD', icon: Clock, color: 'text-blue-600' },
    { value: 'medical_leave', label: 'Medical', icon: Stethoscope, color: 'text-orange-600' },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6" data-testid="attendance-page">
      <div>
        <h1 className="text-2xl font-bold">Mark Attendance</h1>
        <p className="text-muted-foreground">Record student attendance for your classes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Class & Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select
                value={selectedAssignment}
                onChange={(e) => setSelectedAssignment(e.target.value)}
                options={assignments.map((a) => ({
                  value: a._id,
                  label: `${a.subject?.name} - Sem ${a.semester} ${a.section}`,
                }))}
                placeholder="Select Class"
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Session</Label>
              <Select
                value={session}
                onChange={(e) => setSession(e.target.value)}
                options={[
                  { value: 'morning', label: 'Morning' },
                  { value: 'afternoon', label: 'Afternoon' },
                  { value: 'session1', label: 'Session 1' },
                  { value: 'session2', label: 'Session 2' },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {selectedAssignment && students.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Students ({students.length})</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const all: Record<string, string> = {};
                  students.forEach((s) => { all[s._id] = 'present'; });
                  setAttendance(all);
                }}
              >
                Mark All Present
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                <Save className="mr-2 h-4 w-4" />
                {submitting ? 'Saving...' : 'Save Attendance'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell className="font-medium">{student.rollNumber}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {statusOptions.map((opt) => (
                          <Button
                            key={opt.value}
                            size="sm"
                            variant={attendance[student._id] === opt.value ? 'default' : 'outline'}
                            className={attendance[student._id] === opt.value ? '' : opt.color}
                            onClick={() => handleStatusChange(student._id, opt.value)}
                          >
                            <opt.icon className="h-4 w-4" />
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedAssignment && students.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No students found for this class.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
