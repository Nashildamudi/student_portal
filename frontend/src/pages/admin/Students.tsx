import { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Spinner } from '../../components/ui/spinner';
import { Badge } from '../../components/ui/badge';
import type { Department, Course, Student } from '../../types';
import { Plus, Trash2, GraduationCap } from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', password: 'Student@123', phone: '',
    departmentId: '', courseId: '', rollNumber: '',
    semester: 1, section: 'A', academicYear: '2024-25'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{ name: string; email: string; password: string } | null>(null);

  const fetchData = async () => {
    try {
      const [studentsRes, deptsRes, coursesRes] = await Promise.all([
        adminApi.getStudents(filterCourse ? { courseId: filterCourse } : undefined),
        adminApi.getDepartments(),
        adminApi.getCourses(),
      ]);
      setStudents(studentsRes.data.data);
      setDepartments(deptsRes.data.data);
      setCourses(coursesRes.data.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterCourse]);

  // Update courseId options when department changes
  const filteredCourses = formData.departmentId 
    ? courses.filter((c) => c.departmentId === formData.departmentId)
    : courses;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const savedCredentials = { name: formData.name, email: formData.email, password: formData.password };
      await adminApi.createStudent(formData);
      setCreatedCredentials(savedCredentials);
      setFormData({
        name: '', email: '', password: 'Student@123', phone: '',
        departmentId: '', courseId: '', rollNumber: '',
        semester: 1, section: 'A', academicYear: '2024-25'
      });
      setShowForm(false);
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to register student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      await adminApi.deleteStudent(id);
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to delete student');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6" data-testid="students-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-muted-foreground">Manage student registrations</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} data-testid="add-student-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>

      <div className="flex gap-4">
        <Select
          className="w-64"
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
          options={courses.map((c) => ({ value: c._id, label: c.name }))}
          placeholder="All Courses"
        />
      </div>

      {createdCredentials && (
        <Card className="border-green-200 bg-green-50" data-testid="credentials-banner">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-green-800 mb-2">Student Created Successfully!</h3>
                <p className="text-sm text-green-700 mb-1">Share these login credentials with the student:</p>
                <div className="bg-white rounded-lg p-3 mt-2 border border-green-200">
                  <p className="text-sm"><span className="font-medium">Name:</span> {createdCredentials.name}</p>
                  <p className="text-sm"><span className="font-medium">Email:</span> {createdCredentials.email}</p>
                  <p className="text-sm"><span className="font-medium">Password:</span> {createdCredentials.password}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-green-700 hover:bg-green-100"
                onClick={() => setCreatedCredentials(null)}
                data-testid="dismiss-credentials"
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Register New Student</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
              )}
              
              {/* Personal Info */}
              <div className="border-b pb-4">
                <h3 className="font-medium mb-3">Personal Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="9876543210"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Student@123"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Info */}
              <div>
                <h3 className="font-medium mb-3">Academic Information</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="departmentId">Department *</Label>
                    <Select
                      id="departmentId"
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value, courseId: '' })}
                      options={departments.map((d) => ({ value: d._id, label: d.name }))}
                      placeholder="Select Department"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="courseId">Course *</Label>
                    <Select
                      id="courseId"
                      value={formData.courseId}
                      onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                      options={filteredCourses.map((c) => ({ value: c._id, label: c.name }))}
                      placeholder="Select Course"
                      required
                      disabled={!formData.departmentId}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rollNumber">Roll Number *</Label>
                    <Input
                      id="rollNumber"
                      value={formData.rollNumber}
                      onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                      placeholder="CSE2024001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester *</Label>
                    <Select
                      id="semester"
                      value={formData.semester.toString()}
                      onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                      options={[1,2,3,4,5,6,7,8].map((s) => ({ value: s.toString(), label: `Semester ${s}` }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="section">Section *</Label>
                    <Select
                      id="section"
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      options={['A', 'B', 'C', 'D'].map((s) => ({ value: s, label: `Section ${s}` }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="academicYear">Academic Year *</Label>
                    <Select
                      id="academicYear"
                      value={formData.academicYear}
                      onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                      options={['2024-25', '2023-24', '2022-23'].map((y) => ({ value: y, label: y }))}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Register Student'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Sem/Sec</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <GraduationCap className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell className="font-medium">{student.rollNumber}</TableCell>
                    <TableCell>{student.user?.name || 'N/A'}</TableCell>
                    <TableCell className="text-muted-foreground">{student.user?.email || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{student.course?.name || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>Sem {student.semester} / {student.section}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(student._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
