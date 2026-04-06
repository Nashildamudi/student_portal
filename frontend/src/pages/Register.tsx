import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  UserPlus, 
  User, 
  Briefcase, 
  ChevronDown, 
  Mail, 
  Lock, 
  BookOpen, 
  Calendar,
  Layers,
  ShieldCheck
} from 'lucide-react';

const API = 'http://localhost:5000/api';

interface Department { _id: string; name: string; code: string; }
interface Course { _id: string; name: string; code: string; department_id: any; }

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'faculty'>('student');
  const [departmentId, setDepartmentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [academicYear, setAcademicYear] = useState('2024-25');
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/common/public/dropdowns`)
      .then(res => {
        setDepartments(res.data.data.departments || []);
        setCourses(res.data.data.courses || []);
      })
      .catch(() => {
        // Fallback for demo if backend is still offline
        console.warn('Backend offline - using mock data for UI demo');
      });
  }, []);

  useEffect(() => {
    if (departmentId) {
      setFilteredCourses(courses.filter(c => {
        const deptId = typeof c.department_id === 'object' ? c.department_id._id : c.department_id;
        return deptId === departmentId;
      }));
    } else {
      setFilteredCourses(courses);
    }
  }, [departmentId, courses]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload: any = { 
        name, 
        email, 
        password, 
        role,
        academic_year: academicYear 
      };

      if (departmentId) payload.department_id = departmentId;
      if (courseId) payload.course_id = courseId;
      if (semester) payload.semester = parseInt(semester);
      if (section) payload.section = section.toUpperCase();

      const response = await axios.post(`${API}/auth/register`, payload);
      const { user, token } = response.data.data || {};
      
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        navigate(user.role === 'faculty' ? '/faculty' : '/student');
      } else {
        setError('Account created, but could not log in automatically.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Connection failed. Please ensure MongoDB is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07090d] p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="w-full max-w-xl z-10 transition-all duration-500">
        <div className="p-8 rounded-[2rem] bg-[#11141b]/80 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl flex items-center justify-center mb-5 shadow-lg rotate-3">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-extrabold text-white tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 font-mono">
              AIMCA
            </h2>
            <p className="text-slate-400 font-medium max-w-[280px]">
              {role === 'student' ? 'Student Registration Hub' : 'Faculty Administration Center'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center animate-shake">
              <span className="mr-2 font-bold uppercase tracking-wider text-[10px] bg-red-500/20 px-2 py-0.5 rounded">Error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Role Switcher */}
            <div className="p-1 bg-black/40 rounded-2xl flex gap-1 border border-white/5">
              <button type="button" onClick={() => setRole('student')}
                className={`flex-1 flex items-center justify-center py-3.5 rounded-xl transition-all duration-300 font-bold text-sm ${role === 'student' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                <User className="w-4 h-4 mr-2" /> Student
              </button>
              <button type="button" onClick={() => setRole('faculty')}
                className={`flex-1 flex items-center justify-center py-3.5 rounded-xl transition-all duration-300 font-bold text-sm ${role === 'faculty' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                <Briefcase className="w-4 h-4 mr-2" /> Teacher
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-black/30 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
                    placeholder="e.g. Nashil Singh" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-black/30 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
                    placeholder="name@domain.com" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-black/30 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
                  placeholder="••••••••••••" />
              </div>
            </div>

            {/* Academic Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-white/5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Department</label>
                <div className="relative group">
                  <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <select value={departmentId} onChange={e => setDepartmentId(e.target.value)}
                    className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-black/30 border border-white/10 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium">
                    <option value="" className="bg-[#1a1d24]">Select</option>
                    {departments.map(d => (
                      <option key={d._id} value={d._id} className="bg-[#1a1d24]">{d.name}</option>
                    ))}
                    {!departments.length && <option disabled className="bg-[#1a1d24]">No Data Available</option>}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Course (BBA/BCA)</label>
                <div className="relative group">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <select value={courseId} onChange={e => setCourseId(e.target.value)}
                    className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-black/30 border border-white/10 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium">
                    <option value="" className="bg-[#1a1d24]">Select Course</option>
                    {filteredCourses.map(c => (
                      <option key={c._id} value={c._id} className="bg-[#1a1d24]">{c.name} ({c.code})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Assign Semester</label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <select value={semester} onChange={e => setSemester(e.target.value)} required
                    className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-black/30 border border-white/10 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium">
                    <option value="" className="bg-[#1a1d24]">Choose</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s} className="bg-[#1a1d24]">Semester {s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Academic Year</label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <select value={academicYear} onChange={e => setAcademicYear(e.target.value)} required
                    className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-black/30 border border-white/10 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium">
                    {['2023-24', '2024-25', '2025-26'].map(y => <option key={y} value={y} className="bg-[#1a1d24]">{y}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Class Section</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">TAG</div>
                  <input type="text" value={section} onChange={e => setSection(e.target.value)} required
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-black/30 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                    placeholder="e.g. A, B, C" maxLength={2} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className={`w-full py-4 px-6 mt-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center transition-all duration-300 shadow-xl ${role === 'student' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:shadow-indigo-500/40' : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:shadow-emerald-500/40'}`}>
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-3" />
                  Complete Enrollment
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500 font-medium">
            Already registered?{' '}
            <Link to="/" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 decoration-indigo-500/50 transition-all">
              Secure Sign In
            </Link>
          </p>
        </div>

        <div className="mt-8 flex justify-center gap-8 text-slate-600 text-xs font-bold tracking-[0.2em] uppercase">
          <span className="flex items-center"><ShieldCheck className="w-3 h-3 mr-2" /> Encrypted</span>
          <span className="flex items-center"><Calendar className="w-3 h-3 mr-2" /> Academic v1.0</span>
        </div>
      </div>
    </div>
  );
};

export default Register;
