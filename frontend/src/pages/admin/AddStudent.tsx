import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CheckCircle, ChevronRight, ChevronLeft, Loader2, User, BookOpen, ClipboardCheck } from 'lucide-react';
import api from '../../api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const studentSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other', '']).optional(),
  department_id: z.string().min(1, 'Department is required'),
  course_id: z.string().min(1, 'Course is required'),
  semester: z.string().min(1, 'Semester is required'),
  section: z.string().min(1, 'Section is required'),
  roll_number: z.string().min(1, 'Roll number is required'),
  academic_year: z.string().min(1, 'Academic year is required'),
  admission_date: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface Props {
  onComplete: () => void;
}

export const AddStudent: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      password: 'Student@123',
      gender: '',
    },
  });

  useEffect(() => {
    setLoadingDepts(true);
    api.get('/admin/departments')
      .then((res) => setDepartments(res.data.data || []))
      .finally(() => setLoadingDepts(false));
  }, []);

  const selectedDept = form.watch('department_id');

  useEffect(() => {
    if (selectedDept) {
      setLoadingCourses(true);
      api.get(`/admin/courses?departmentId=${selectedDept}`)
        .then((res) => {
          setFilteredCourses(res.data.data || []);
          form.setValue('course_id', '');
        })
        .finally(() => setLoadingCourses(false));
    } else {
      setFilteredCourses([]);
    }
  }, [selectedDept]);

  const nextStep = async () => {
    let fields: (keyof StudentFormData)[] = [];
    if (step === 1) fields = ['name', 'email', 'password'];
    if (step === 2) fields = ['department_id', 'course_id', 'semester', 'section', 'roll_number', 'academic_year'];
    const valid = await form.trigger(fields);
    if (valid) setStep((s) => s + 1);
  };

  const onSubmit = async (data: StudentFormData) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        ...data,
        semester: parseInt(data.semester),
        admission_date: data.admission_date || undefined,
        date_of_birth: data.date_of_birth || undefined,
        gender: data.gender || undefined,
      };
      await api.post('/admin/students', payload);
      setSuccessMsg('Student registered successfully!');
      setTimeout(() => {
        setSuccessMsg('');
        form.reset({ password: 'Student@123', gender: '' });
        setStep(1);
        onComplete();
      }, 2000);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Failed to register student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const labelClass = 'block text-sm font-medium text-slate-300 mb-1.5';
  const selectClass = 'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all';
  const fieldError = (field: keyof StudentFormData) =>
    form.formState.errors[field] && (
      <p className="text-red-400 text-xs mt-1">{form.formState.errors[field]?.message as string}</p>
    );

  const deptName = departments.find((d) => d._id === form.getValues('department_id'))?.name || '—';
  const courseName = filteredCourses.find((c) => c._id === form.getValues('course_id'))?.name || '—';

  const steps = [
    { label: 'Personal', icon: User },
    { label: 'Academic', icon: BookOpen },
    { label: 'Review', icon: ClipboardCheck },
  ];

  return (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
      <h3 className="text-xl font-bold text-white mb-2">Register New Student</h3>
      <p className="text-slate-400 text-sm mb-6">Fill in the details below to create a student account.</p>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {steps.map((s, i) => (
          <React.Fragment key={s.label}>
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step > i + 1 ? 'bg-emerald-500 text-white' : step === i + 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-700 text-slate-400'}`}>
                {step > i + 1 ? <CheckCircle className="w-5 h-5" /> : i + 1}
              </div>
              <span className={`text-xs mt-1 ${step === i + 1 ? 'text-blue-400' : 'text-slate-500'}`}>{s.label}</span>
            </div>
            {i < 2 && <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all ${step > i + 1 ? 'bg-emerald-500' : 'bg-slate-700'}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="flex items-center space-x-2 p-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl mb-6">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl mb-6 text-sm">{errorMsg}</div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-white text-base">Personal Information</h4>
            <div>
              <label className={labelClass}>Full Name *</label>
              <Input {...form.register('name')} placeholder="e.g. John Doe" className="bg-slate-900 border-slate-700 text-white" />
              {fieldError('name')}
            </div>
            <div>
              <label className={labelClass}>Email Address *</label>
              <Input type="email" {...form.register('email')} placeholder="student@college.edu" className="bg-slate-900 border-slate-700 text-white" />
              {fieldError('email')}
            </div>
            <div>
              <label className={labelClass}>Password *</label>
              <Input type="text" {...form.register('password')} className="bg-slate-900 border-slate-700 text-white font-mono" />
              {fieldError('password')}
              <p className="text-xs text-slate-500 mt-1">Min 8 characters. Share this with the student.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Phone Number</label>
                <Input {...form.register('phone')} placeholder="+91 9876543210" className="bg-slate-900 border-slate-700 text-white" />
              </div>
              <div>
                <label className={labelClass}>Date of Birth</label>
                <Input type="date" {...form.register('date_of_birth')} className="bg-slate-900 border-slate-700 text-white" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Gender</label>
              <select {...form.register('gender')} className={selectClass}>
                <option value="">Select gender...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <Button type="button" onClick={nextStep} className="mt-2 w-full bg-blue-600 hover:bg-blue-700">
              Next: Academic Info <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 2: Academic Info */}
        {step === 2 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-white text-base">Academic Information</h4>
            <div>
              <label className={labelClass}>Department *</label>
              {loadingDepts ? (
                <div className="flex items-center space-x-2 text-slate-400 text-sm py-2"><Loader2 className="w-4 h-4 animate-spin" /><span>Loading departments...</span></div>
              ) : (
                <select {...form.register('department_id')} className={selectClass}>
                  <option value="">— Select Department —</option>
                  {departments.map((d: any) => (
                    <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              )}
              {fieldError('department_id')}
            </div>
            <div>
              <label className={labelClass}>Course *</label>
              {loadingCourses ? (
                <div className="flex items-center space-x-2 text-slate-400 text-sm py-2"><Loader2 className="w-4 h-4 animate-spin" /><span>Loading courses...</span></div>
              ) : (
                <select {...form.register('course_id')} className={selectClass} disabled={!selectedDept}>
                  <option value="">{selectedDept ? '— Select Course —' : '— Select a department first —'}</option>
                  {filteredCourses.map((c: any) => (
                    <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              )}
              {fieldError('course_id')}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Semester *</label>
                <select {...form.register('semester')} className={selectClass}>
                  <option value="">—</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                {fieldError('semester')}
              </div>
              <div>
                <label className={labelClass}>Section *</label>
                <Input {...form.register('section')} placeholder="A" className="bg-slate-900 border-slate-700 text-white" />
                {fieldError('section')}
              </div>
              <div>
                <label className={labelClass}>Roll Number *</label>
                <Input {...form.register('roll_number')} placeholder="BCA/23/001" className="bg-slate-900 border-slate-700 text-white" />
                {fieldError('roll_number')}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Academic Year *</label>
                <Input {...form.register('academic_year')} placeholder="2024-2025" className="bg-slate-900 border-slate-700 text-white" />
                {fieldError('academic_year')}
              </div>
              <div>
                <label className={labelClass}>Admission Date</label>
                <Input type="date" {...form.register('admission_date')} className="bg-slate-900 border-slate-700 text-white" />
              </div>
            </div>
            <div className="flex space-x-3 mt-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button type="button" onClick={nextStep} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Review <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-white text-base">Review & Confirm</h4>
            <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
              <div className="px-4 py-3 bg-slate-800 border-b border-slate-700">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Personal Details</p>
              </div>
              <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {[
                  ['Name', form.getValues('name')],
                  ['Email', form.getValues('email')],
                  ['Phone', form.getValues('phone') || '—'],
                  ['Gender', form.getValues('gender') || '—'],
                  ['Date of Birth', form.getValues('date_of_birth') || '—'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-slate-500 text-xs">{k}</p>
                    <p className="text-white font-medium">{v}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 bg-slate-800 border-t border-b border-slate-700">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Academic Details</p>
              </div>
              <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {[
                  ['Department', deptName],
                  ['Course', courseName],
                  ['Semester', form.getValues('semester')],
                  ['Section', form.getValues('section')],
                  ['Roll Number', form.getValues('roll_number')],
                  ['Academic Year', form.getValues('academic_year')],
                  ['Admission Date', form.getValues('admission_date') || '—'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-slate-500 text-xs">{k}</p>
                    <p className="text-white font-medium">{v}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex space-x-3">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700" disabled={loading}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Registering...</> : '✓ Confirm Registration'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
