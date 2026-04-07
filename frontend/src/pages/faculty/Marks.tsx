import { useState, useEffect } from 'react';
import { facultyApi } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Spinner } from '../../components/ui/spinner';
import { Badge } from '../../components/ui/badge';
import type { TeachingAssignment, MarkComponent } from '../../types';
import { Award, Plus, Trash2, Save } from 'lucide-react';

interface StudentForMarks {
  _id: string;
  rollNumber: string;
  name: string;
}

interface MarkRecord {
  studentId: string;
  marksObtained: number;
}

export default function MarksPage() {
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [components, setComponents] = useState<MarkComponent[]>([]);
  const [students, setStudents] = useState<StudentForMarks[]>([]);
  const [existingMarks, setExistingMarks] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [componentForm, setComponentForm] = useState({ name: '', maxMarks: 20, type: 'internal' });
  const [marks, setMarks] = useState<Record<string, Record<string, number>>>({});
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

    const fetchData = async () => {
      try {
        const [componentsRes, studentsRes, marksRes] = await Promise.all([
          facultyApi.getMarkComponents(selectedAssignment),
          facultyApi.getStudentsForAssignment(selectedAssignment),
          facultyApi.getMarks(selectedAssignment),
        ]);
        
        setComponents(componentsRes.data.data);
        setStudents(studentsRes.data.data);
        
        // Build existing marks map
        const marksMap: Record<string, Record<string, number>> = {};
        marksRes.data.data.marks.forEach((m: { studentId: string; componentId: string; marksObtained: number }) => {
          if (!marksMap[m.studentId]) marksMap[m.studentId] = {};
          marksMap[m.studentId][m.componentId] = m.marksObtained;
        });
        setExistingMarks(marksMap);
        setMarks(marksMap);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    fetchData();
  }, [selectedAssignment]);

  const handleAddComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await facultyApi.createMarkComponent({
        assignmentId: selectedAssignment,
        ...componentForm,
      });
      setComponentForm({ name: '', maxMarks: 20, type: 'internal' });
      setShowAddComponent(false);
      
      // Refresh components
      const response = await facultyApi.getMarkComponents(selectedAssignment);
      setComponents(response.data.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to add component');
    }
  };

  const handleDeleteComponent = async (componentId: string) => {
    if (!confirm('Delete this component and all associated marks?')) return;
    
    try {
      await facultyApi.deleteMarkComponent(componentId);
      setComponents((prev) => prev.filter((c) => c._id !== componentId));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to delete component');
    }
  };

  const handleMarkChange = (studentId: string, componentId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [componentId]: numValue,
      },
    }));
  };

  const handleSaveMarks = async () => {
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const entries: Array<{ componentId: string; studentId: string; marksObtained: number }> = [];
      
      Object.entries(marks).forEach(([studentId, componentMarks]) => {
        Object.entries(componentMarks).forEach(([componentId, marksObtained]) => {
          entries.push({ componentId, studentId, marksObtained });
        });
      });

      if (entries.length > 0) {
        await facultyApi.enterMarks(entries);
        setMessage({ type: 'success', text: 'Marks saved successfully!' });
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save marks' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6" data-testid="marks-page">
      <div>
        <h1 className="text-2xl font-bold">Marks Management</h1>
        <p className="text-muted-foreground">Create components and enter student marks</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Select Class
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            className="w-full md:w-96"
            value={selectedAssignment}
            onChange={(e) => setSelectedAssignment(e.target.value)}
            options={assignments.map((a) => ({
              value: a._id,
              label: `${a.subject?.name} - Sem ${a.semester} ${a.section}`,
            }))}
            placeholder="Select Class"
          />
        </CardContent>
      </Card>

      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {selectedAssignment && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Mark Components</CardTitle>
              <Button size="sm" onClick={() => setShowAddComponent(!showAddComponent)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Component
              </Button>
            </CardHeader>
            <CardContent>
              {showAddComponent && (
                <form onSubmit={handleAddComponent} className="mb-4 p-4 border rounded-lg space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Component Name</Label>
                      <Input
                        value={componentForm.name}
                        onChange={(e) => setComponentForm({ ...componentForm, name: e.target.value })}
                        placeholder="Internal Test 1"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Marks</Label>
                      <Input
                        type="number"
                        min="1"
                        max="200"
                        value={componentForm.maxMarks}
                        onChange={(e) => setComponentForm({ ...componentForm, maxMarks: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={componentForm.type}
                        onChange={(e) => setComponentForm({ ...componentForm, type: e.target.value })}
                        options={[
                          { value: 'internal', label: 'Internal' },
                          { value: 'assignment', label: 'Assignment' },
                          { value: 'quiz', label: 'Quiz' },
                          { value: 'project', label: 'Project' },
                          { value: 'lab', label: 'Lab' },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">Create</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowAddComponent(false)}>Cancel</Button>
                  </div>
                </form>
              )}

              {components.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No components created yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {components.map((c) => (
                    <Badge key={c._id} variant="secondary" className="flex items-center gap-2 py-1 px-3">
                      {c.name} ({c.maxMarks})
                      <button
                        onClick={() => handleDeleteComponent(c._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {components.length > 0 && students.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Enter Marks</CardTitle>
                <Button onClick={handleSaveMarks} disabled={submitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {submitting ? 'Saving...' : 'Save All Marks'}
                </Button>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-white">Roll No</TableHead>
                      <TableHead className="sticky left-20 bg-white">Name</TableHead>
                      {components.map((c) => (
                        <TableHead key={c._id} className="text-center min-w-[100px]">
                          {c.name}
                          <div className="text-xs font-normal">Max: {c.maxMarks}</div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell className="sticky left-0 bg-white font-medium">{student.rollNumber}</TableCell>
                        <TableCell className="sticky left-20 bg-white">{student.name}</TableCell>
                        {components.map((c) => (
                          <TableCell key={c._id}>
                            <Input
                              type="number"
                              min="0"
                              max={c.maxMarks}
                              className="w-20"
                              value={marks[student._id]?.[c._id] ?? ''}
                              onChange={(e) => handleMarkChange(student._id, c._id, e.target.value)}
                              placeholder="0"
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
