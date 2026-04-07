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
import type { Department, Faculty } from '../../types';
import { Plus, Trash2, UserCog } from 'lucide-react';

export default function FacultyPage() {
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', password: 'Faculty@123', phone: '',
    departmentId: '', employeeId: '', designation: '', specialization: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{ name: string; email: string; password: string } | null>(null);

  const fetchData = async () => {
    try {
      const [facultyRes, deptsRes] = await Promise.all([
        adminApi.getFaculty(filterDept || undefined),
        adminApi.getDepartments(),
      ]);
      setFacultyList(facultyRes.data.data);
      setDepartments(deptsRes.data.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterDept]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await adminApi.createFaculty(formData);
      setFormData({
        name: '', email: '', password: 'Faculty@123', phone: '',
        departmentId: '', employeeId: '', designation: '', specialization: ''
      });
      setShowForm(false);
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to register faculty');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this faculty member?')) return;

    try {
      await adminApi.deleteFaculty(id);
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to delete faculty');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6" data-testid="faculty-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Faculty</h1>
          <p className="text-muted-foreground">Manage faculty members</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} data-testid="add-faculty-btn">
          <Plus className="mr-2 h-4 w-4" />
          Add Faculty
        </Button>
      </div>

      <div className="flex gap-4">
        <Select
          className="w-64"
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          options={departments.map((d) => ({ value: d._id, label: d.name }))}
          placeholder="All Departments"
        />
      </div>

      {createdCredentials && (
        <Card className="border-green-200 bg-green-50" data-testid="faculty-credentials-banner">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-green-800 mb-2">Faculty Created Successfully!</h3>
                <p className="text-sm text-green-700 mb-1">Share these login credentials with the faculty member:</p>
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
                data-testid="dismiss-faculty-credentials"
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
            <CardTitle>Register New Faculty</CardTitle>
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
                      placeholder="Dr. John Smith"
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
                      placeholder="john.smith@portal.com"
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
                      placeholder="Faculty@123"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Info */}
              <div>
                <h3 className="font-medium mb-3">Professional Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="departmentId">Department *</Label>
                    <Select
                      id="departmentId"
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      options={departments.map((d) => ({ value: d._id, label: d.name }))}
                      placeholder="Select Department"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID *</Label>
                    <Input
                      id="employeeId"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      placeholder="FAC001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation *</Label>
                    <Select
                      id="designation"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      options={[
                        { value: 'Professor', label: 'Professor' },
                        { value: 'Associate Professor', label: 'Associate Professor' },
                        { value: 'Assistant Professor', label: 'Assistant Professor' },
                        { value: 'Lecturer', label: 'Lecturer' },
                      ]}
                      placeholder="Select Designation"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      placeholder="Machine Learning"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Register Faculty'}
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
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facultyList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <UserCog className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    No faculty found
                  </TableCell>
                </TableRow>
              ) : (
                facultyList.map((faculty) => (
                  <TableRow key={faculty._id}>
                    <TableCell className="font-medium">{faculty.employeeId}</TableCell>
                    <TableCell>{faculty.user?.name || 'N/A'}</TableCell>
                    <TableCell className="text-muted-foreground">{faculty.user?.email || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{faculty.department?.name || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>{faculty.designation}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(faculty._id)}
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
