import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Trash2, Plus, Loader2, AlertCircle } from 'lucide-react';
import api from '../../api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const assignmentSchema = z.object({
  faculty_id: z.string().min(1, 'Faculty is required'),
  department_id: z.string().min(1, 'Department is required'),
  course_id: z.string().min(1, 'Course is required'),
  subject_id: z.string().min(1, 'Subject is required'),
  semester: z.string().min(1, 'Semester is required'),
  section: z.string().min(1, 'Section is required'),
  academic_year: z.string().min(1, 'Academic Year is required'),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

export const Assignments: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
  });

  const selectedDept = form.watch('department_id');
  const selectedCourse = form.watch('course_id');

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aRes, uRes, dRes] = await Promise.all([
        api.get('/admin/assignments'),
        api.get('/admin/users'),
        api.get('/admin/departments'),
      ]);
      setAssignments(aRes.data.data || []);
      setFaculty((uRes.data.data || []).filter((u: any) => u.role === 'faculty'));
      setDepartments(dRes.data.data || []);
    } catch {
      showMsg('Failed to load data. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Cascading: Department → Courses
  useEffect(() => {
    if (selectedDept) {
      setLoadingCourses(true);
      setCourses([]);
      setSubjects([]);
      form.setValue('course_id', '');
      form.setValue('subject_id', '');
      api.get(`/admin/courses?departmentId=${selectedDept}`)
        .then((res) => setCourses(res.data.data || []))
        .finally(() => setLoadingCourses(false));
    } else {
      setCourses([]);
      setSubjects([]);
    }
  }, [selectedDept]);

  // Cascading: Course → Subjects
  useEffect(() => {
    if (selectedCourse) {
      setLoadingSubjects(true);
      setSubjects([]);
      form.setValue('subject_id', '');
      api.get(`/admin/subjects?courseId=${selectedCourse}`)
        .then((res) => setSubjects(res.data.data || []))
        .finally(() => setLoadingSubjects(false));
    } else {
      setSubjects([]);
    }
  }, [selectedCourse]);

  const onSubmit = async (data: AssignmentFormData) => {
    setSubmitting(true);
    try {
      await api.post('/admin/assignments', {
        ...data,
        semester: parseInt(data.semester),
      });
      showMsg('Teaching assignment created successfully!', 'success');
      form.reset();
      fetchData();
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Error creating assignment';
      showMsg(
        msg.includes('duplicate') || msg.includes('unique')
          ? 'This subject+semester+section+year combination already has an assignment.'
          : msg,
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      await api.delete(`/admin/assignments/${id}`);
      showMsg('Assignment deleted.', 'success');
      setDeleteConfirm(null);
      fetchData();
    } catch {
      showMsg('Error deleting assignment.', 'error');
    }
  };

  const labelClass = 'block text-xs font-medium text-slate-400 mb-1.5';
  const selectClass = 'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white">Teaching Assignments</h3>

      {msg && (
        <div className={`flex items-center space-x-2 p-4 rounded-xl ${msgType === 'success' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/20 border border-red-500/30 text-red-300'}`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{msg}</span>
        </div>
      )}

      {/* Create Assignment Form */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <h4 className="font-semibold text-white mb-5 flex items-center space-x-2">
          <Plus className="w-4 h-4 text-blue-400" />
          <span>Create New Assignment</span>
        </h4>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Row 1: Faculty */}
          <div>
            <label className={labelClass}>Faculty *</label>
            <select {...form.register('faculty_id')} className={selectClass}>
              <option value="">— Select Faculty —</option>
              {faculty.map((f) => (
                <option key={f._id} value={f._id}>{f.name} ({f.email})</option>
              ))}
            </select>
            {form.formState.errors.faculty_id && <p className="text-red-400 text-xs mt-1">{form.formState.errors.faculty_id.message}</p>}
          </div>

          {/* Row 2: Dept → Course → Subject (cascading) */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Department *</label>
              <select {...form.register('department_id')} className={selectClass}>
                <option value="">— Department —</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
              {form.formState.errors.department_id && <p className="text-red-400 text-xs mt-1">{form.formState.errors.department_id.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Course *</label>
              <div className="relative">
                <select {...form.register('course_id')} className={selectClass} disabled={!selectedDept || loadingCourses}>
                  <option value="">{loadingCourses ? 'Loading...' : selectedDept ? '— Course —' : '— Pick Dept first —'}</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                {loadingCourses && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-slate-400" />}
              </div>
              {form.formState.errors.course_id && <p className="text-red-400 text-xs mt-1">{form.formState.errors.course_id.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Subject *</label>
              <div className="relative">
                <select {...form.register('subject_id')} className={selectClass} disabled={!selectedCourse || loadingSubjects}>
                  <option value="">{loadingSubjects ? 'Loading...' : selectedCourse ? '— Subject —' : '— Pick Course first —'}</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} (Sem {s.semester})</option>
                  ))}
                </select>
                {loadingSubjects && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-slate-400" />}
              </div>
              {form.formState.errors.subject_id && <p className="text-red-400 text-xs mt-1">{form.formState.errors.subject_id.message}</p>}
            </div>
          </div>

          {/* Row 3: Semester, Section, Academic Year */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Semester *</label>
              <select {...form.register('semester')} className={selectClass}>
                <option value="">—</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              {form.formState.errors.semester && <p className="text-red-400 text-xs mt-1">{form.formState.errors.semester.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Section *</label>
              <Input {...form.register('section')} placeholder="A" className="bg-slate-900 border-slate-700 text-white text-sm" />
              {form.formState.errors.section && <p className="text-red-400 text-xs mt-1">{form.formState.errors.section.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Academic Year *</label>
              <Input {...form.register('academic_year')} placeholder="2024-25" className="bg-slate-900 border-slate-700 text-white text-sm" />
              {form.formState.errors.academic_year && <p className="text-red-400 text-xs mt-1">{form.formState.errors.academic_year.message}</p>}
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700">
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Assigning...</> : <><Plus className="w-4 h-4 mr-2" />Assign Faculty to Subject</>}
          </Button>
        </form>
      </div>

      {/* Assignments Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h4 className="font-semibold text-white">Existing Assignments</h4>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
        </div>

        {assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Plus className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm">No teaching assignments yet. Create one above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">Faculty</th>
                  <th className="text-left px-5 py-3 font-medium">Subject</th>
                  <th className="text-left px-5 py-3 font-medium">Course</th>
                  <th className="text-center px-5 py-3 font-medium">Sem / Sec</th>
                  <th className="text-center px-5 py-3 font-medium">Year</th>
                  <th className="text-center px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a._id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{a.faculty_id?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{a.faculty_id?.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-emerald-400 font-medium">{a.subject_id?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500 font-mono">{a.subject_id?.code}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-300">{a.course_id?.name || '—'}</td>
                    <td className="px-5 py-3 text-center text-slate-300">
                      <span className="px-2 py-0.5 bg-slate-700 rounded-md text-xs">Sem {a.semester}</span>
                      {' / '}
                      <span className="px-2 py-0.5 bg-slate-700 rounded-md text-xs">Sec {a.section}</span>
                    </td>
                    <td className="px-5 py-3 text-center text-slate-400 text-xs">{a.academic_year}</td>
                    <td className="px-5 py-3 text-center">
                      {deleteConfirm === a._id ? (
                        <div className="flex items-center justify-center space-x-2">
                          <button onClick={() => deleteAssignment(a._id)} className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Confirm</button>
                          <button onClick={() => setDeleteConfirm(null)} className="text-xs px-2 py-1 bg-slate-600 text-white rounded hover:bg-slate-500">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(a._id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
