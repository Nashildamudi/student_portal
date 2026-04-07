import { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Spinner } from '../../components/ui/spinner';
import { Badge } from '../../components/ui/badge';
import type { Department, Course, Subject, TeachingAssignment, User } from '../../types';
import { Plus, Trash2, ClipboardList } from 'lucide-react';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    facultyId: '', subjectId: '', departmentId: '', courseId: '',
    semester: 1, section: 'A', academicYear: '2024-25'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [assignmentsRes, deptsRes, coursesRes, subjectsRes, usersRes] = await Promise.all([
        adminApi.getAssignments(),
        adminApi.getDepartments(),
        adminApi.getCourses(),
        adminApi.getSubjects(),
        adminApi.getUsers('faculty'),
      ]);
      setAssignments(assignmentsRes.data.data);
      setDepartments(deptsRes.data.data);
      setCourses(coursesRes.data.data);
      setSubjects(subjectsRes.data.data);
      setFacultyList(usersRes.data.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Cascading filters
  const filteredCourses = formData.departmentId 
    ? courses.filter((c) => c.departmentId === formData.departmentId)
    : courses;

  const filteredSubjects = formData.courseId 
    ? subjects.filter((s) => s.courseId === formData.courseId && s.semester === formData.semester)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await adminApi.createAssignment(formData);
      setFormData({
        facultyId: '', subjectId: '', departmentId: '', courseId: '',
        semester: 1, section: 'A', academicYear: '2024-25'
      });
      setShowForm(false);
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      await adminApi.deleteAssignment(id);
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to delete assignment');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6" data-testid="assignments-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teaching Assignments</h1>
          <p className="text-muted-foreground">Assign faculty to subjects</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} data-testid="add-assignment-btn">
          <Plus className="mr-2 h-4 w-4" />
          Create Assignment
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Teaching Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
              )}
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="facultyId">Faculty *</Label>
                  <Select
                    id="facultyId"
                    value={formData.facultyId}
                    onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                    options={facultyList.map((f) => ({ value: f._id, label: f.name }))}
                    placeholder="Select Faculty"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departmentId">Department *</Label>
                  <Select
                    id="departmentId"
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value, courseId: '', subjectId: '' })}
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
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value, subjectId: '' })}
                    options={filteredCourses.map((c) => ({ value: c._id, label: c.name }))}
                    placeholder="Select Course"
                    required
                    disabled={!formData.departmentId}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester *</Label>
                  <Select
                    id="semester"
                    value={formData.semester.toString()}
                    onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value), subjectId: '' })}
                    options={[1,2,3,4,5,6,7,8].map((s) => ({ value: s.toString(), label: `Semester ${s}` }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subjectId">Subject *</Label>
                  <Select
                    id="subjectId"
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    options={filteredSubjects.map((s) => ({ value: s._id, label: `${s.name} (${s.code})` }))}
                    placeholder="Select Subject"
                    required
                    disabled={!formData.courseId}
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

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Assignment'}
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
                <TableHead>Faculty</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Sem/Sec</TableHead>
                <TableHead>Year</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <ClipboardList className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    No assignments found
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((assignment) => (
                  <TableRow key={assignment._id}>
                    <TableCell className="font-medium">{assignment.faculty?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <div>{assignment.subject?.name || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{assignment.subject?.code}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{assignment.course?.name || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>Sem {assignment.semester} / {assignment.section}</TableCell>
                    <TableCell>{assignment.academicYear}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(assignment._id)}
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
