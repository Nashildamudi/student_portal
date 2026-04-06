import React, { useState, useEffect } from 'react';
import { LogOut, LayoutDashboard, Users, Building, BookOpen, GraduationCap, Plus, Trash2, Menu, UserPlus, BookCopy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

import { AddStudent } from './AddStudent';
import { AddFaculty } from './AddFaculty';
import { Assignments } from './Assignments';

type Tab = 'overview' | 'users' | 'add-student' | 'add-faculty' | 'assignments' | 'departments' | 'courses' | 'subjects';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [tab, setTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // New form states
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseDept, setNewCourseDept] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubCourse, setNewSubCourse] = useState('');
  const [newSubSem, setNewSubSem] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [u, d, c, s] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/departments'),
        api.get('/admin/courses'),
        api.get('/admin/subjects'),
      ]);
      setUsers(u.data.data || []);
      setDepartments(d.data.data || []);
      setCourses(c.data.data || []);
      setSubjects(s.data.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const inputClass = 'px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all';
  const selectClass = 'px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all';

  const addDept = async () => {
    if (!newDeptName || !newDeptCode) return;
    try {
      await api.post('/admin/departments', { name: newDeptName, code: newDeptCode });
      setNewDeptName(''); setNewDeptCode('');
      showMsg('Department created!');
      fetchAll();
    } catch (e: any) { showMsg(e.response?.data?.message || 'Error'); }
  };

  const deleteDept = async (id: string) => {
    try { await api.delete(`/admin/departments/${id}`); fetchAll(); showMsg('Deleted!'); }
    catch (e: any) { showMsg(e.response?.data?.message || 'Error'); }
  };

  const addCourse = async () => {
    if (!newCourseName || !newCourseCode || !newCourseDept) return;
    try {
      await api.post('/admin/courses', { name: newCourseName, code: newCourseCode, department_id: newCourseDept });
      setNewCourseName(''); setNewCourseCode(''); setNewCourseDept('');
      showMsg('Course created!'); fetchAll();
    } catch (e: any) { showMsg(e.response?.data?.message || 'Error'); }
  };

  const addSubject = async () => {
    if (!newSubName || !newSubCode || !newSubCourse) return;
    try {
      await api.post('/admin/subjects', { name: newSubName, code: newSubCode, course_id: newSubCourse, ...(newSubSem ? { semester: parseInt(newSubSem) } : {}) });
      setNewSubName(''); setNewSubCode(''); setNewSubCourse(''); setNewSubSem('');
      showMsg('Subject created!'); fetchAll();
    } catch (e: any) { showMsg(e.response?.data?.message || 'Error'); }
  };

  const deleteUser = async (id: string) => {
    try { await api.delete(`/admin/users/${id}`); fetchAll(); showMsg('User deleted!'); }
    catch (e: any) { showMsg(e.response?.data?.message || 'Error'); }
  };

  const navItems: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'All Users', icon: Users },
    { id: 'add-student', label: 'Add Student', icon: UserPlus },
    { id: 'add-faculty', label: 'Add Faculty', icon: UserPlus },
    { id: 'assignments', label: 'Assignments', icon: BookCopy },
    { id: 'departments', label: 'Departments', icon: Building },
    { id: 'courses', label: 'Courses', icon: GraduationCap },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
  ];

  const roleColors: Record<string, string> = {
    admin: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    faculty: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    student: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  };

  return (
    <div className="min-h-screen flex bg-slate-900 text-white">
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed md:relative z-30 md:z-auto w-64 bg-slate-800 border-r border-slate-700 flex flex-col h-screen transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-5 border-b border-slate-700 flex items-center space-x-3">
          <LayoutDashboard className="text-blue-500 w-6 h-6 flex-shrink-0" />
          <h1 className="text-lg font-bold text-white">Admin<span className="text-blue-500">Panel</span></h1>
        </div>
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-lg flex-shrink-0">
              {user.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white truncate">{user.name || 'Admin'}</p>
              <p className="text-xs text-blue-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-left ${tab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <button onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white capitalize">{tab}</h2>
          </div>
          {msg && <span className={`text-sm px-3 py-1.5 rounded-lg ${msg.includes('!') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>{msg}</span>}
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview */}
          {tab === 'overview' && (
            <div>
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-1">Admin Dashboard</h3>
                <p className="text-slate-400">Manage your institution's data.</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {[
                  { label: 'Total Users', val: users.length, icon: Users, color: 'blue' },
                  { label: 'Departments', val: departments.length, icon: Building, color: 'purple' },
                  { label: 'Courses', val: courses.length, icon: GraduationCap, color: 'teal' },
                  { label: 'Subjects', val: subjects.length, icon: BookOpen, color: 'emerald' },
                ].map(stat => (
                  <div key={stat.label} className="bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-slate-400 text-sm">{stat.label}</span>
                      <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                    </div>
                    <p className="text-4xl font-bold text-white">{stat.val}</p>
                  </div>
                ))}
              </div>
              <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl">
                <h4 className="font-bold text-white mb-4">Quick Actions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {navItems.filter(n => n.id !== 'overview').map(n => (
                    <button key={n.id} onClick={() => setTab(n.id)}
                      className="flex items-center space-x-2 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-all text-sm">
                      <n.icon className="w-4 h-4 text-blue-400" />
                      <span>Manage {n.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users */}
          {tab === 'users' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-6">User Management</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {['student', 'faculty', 'admin'].map(role => (
                  <div key={role} className="bg-slate-800 border border-slate-700 p-4 rounded-2xl text-center">
                    <p className="text-3xl font-bold text-white">{users.filter(u => u.role === role).length}</p>
                    <p className="text-sm text-slate-400 mt-1 capitalize">{role}s</p>
                  </div>
                ))}
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700">
                  <h4 className="font-semibold text-white">All Users ({users.length})</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400">
                        <th className="text-left px-5 py-3 font-medium">Name</th>
                        <th className="text-left px-5 py-3 font-medium">Email</th>
                        <th className="text-center px-5 py-3 font-medium">Role</th>
                        <th className="text-center px-5 py-3 font-medium">Status</th>
                        <th className="text-center px-5 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u._id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                          <td className="px-5 py-3 font-medium text-white">{u.name}</td>
                          <td className="px-5 py-3 text-slate-300">{u.email}</td>
                          <td className="px-5 py-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${roleColors[u.role] || ''}`}>{u.role}</span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${u.is_active ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-500/20 text-slate-400 border-slate-500/40'}`}>
                              {u.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            {u.role !== 'admin' && (
                              <button onClick={() => deleteUser(u._id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors" title="Delete user">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Add Student */}
          {tab === 'add-student' && (
            <div className="max-w-2xl">
              <AddStudent onComplete={() => { fetchAll(); setTab('users'); }} />
            </div>
          )}

          {/* Add Faculty */}
          {tab === 'add-faculty' && (
            <div className="max-w-2xl">
              <AddFaculty onComplete={() => { fetchAll(); setTab('users'); }} />
            </div>
          )}

          {/* Assignments */}
          {tab === 'assignments' && (
            <div className="max-w-4xl">
              <Assignments />
            </div>
          )}

          {/* Departments */}
          {tab === 'departments' && (
            <div className="max-w-3xl">
              <h3 className="text-xl font-bold text-white mb-6">Departments</h3>
              <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl mb-5">
                <h4 className="font-semibold text-white mb-3">Add New Department</h4>
                <div className="flex gap-3 flex-wrap">
                  <input value={newDeptName} onChange={e => setNewDeptName(e.target.value)} className={inputClass} placeholder="Department name (e.g. BCA)" />
                  <input value={newDeptCode} onChange={e => setNewDeptCode(e.target.value)} className={`${inputClass} w-32`} placeholder="Code" />
                  <button onClick={addDept} className="flex items-center space-x-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20">
                    <Plus className="w-4 h-4" /><span>Add</span>
                  </button>
                </div>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
                {departments.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-slate-500">No departments yet. Add one above.</div>
                ) : (
                  <div className="divide-y divide-slate-700/50">
                    {departments.map(d => (
                      <div key={d._id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-700/20 transition-colors">
                        <div>
                          <p className="font-medium text-white">{d.name}</p>
                          <p className="text-xs text-blue-400 mt-0.5">{d.code}</p>
                        </div>
                        <button onClick={() => deleteDept(d._id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Courses */}
          {tab === 'courses' && (
            <div className="max-w-3xl">
              <h3 className="text-xl font-bold text-white mb-6">Courses</h3>
              <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl mb-5">
                <h4 className="font-semibold text-white mb-3">Add New Course</h4>
                <div className="flex flex-wrap gap-3">
                  <select value={newCourseDept} onChange={e => setNewCourseDept(e.target.value)} className={selectClass}>
                    <option value="">-- Department --</option>
                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                  <input value={newCourseName} onChange={e => setNewCourseName(e.target.value)} className={inputClass} placeholder="Course name (e.g. BCA)" />
                  <input value={newCourseCode} onChange={e => setNewCourseCode(e.target.value)} className={`${inputClass} w-28`} placeholder="Code" />
                  <button onClick={addCourse} className="flex items-center space-x-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20">
                    <Plus className="w-4 h-4" /><span>Add</span>
                  </button>
                </div>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
                {courses.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-slate-500">No courses yet.</div>
                ) : (
                  <div className="divide-y divide-slate-700/50">
                    {courses.map(c => (
                      <div key={c._id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-700/20 transition-colors">
                        <div>
                          <p className="font-medium text-white">{c.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{c.code} · {typeof c.department_id === 'object' ? c.department_id?.name : ''}</p>
                        </div>
                        <span className="text-xs px-2.5 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/40 rounded-full">{c.code}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subjects */}
          {tab === 'subjects' && (
            <div className="max-w-4xl">
              <h3 className="text-xl font-bold text-white mb-6">Subjects</h3>
              <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl mb-5">
                <h4 className="font-semibold text-white mb-3">Add New Subject</h4>
                <div className="flex flex-wrap gap-3">
                  <select value={newSubCourse} onChange={e => setNewSubCourse(e.target.value)} className={selectClass}>
                    <option value="">-- Course --</option>
                    {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                  <input value={newSubName} onChange={e => setNewSubName(e.target.value)} className={inputClass} placeholder="Subject name" />
                  <input value={newSubCode} onChange={e => setNewSubCode(e.target.value)} className={`${inputClass} w-28`} placeholder="Code" />
                  <input value={newSubSem} onChange={e => setNewSubSem(e.target.value)} className={`${inputClass} w-28`} type="number" placeholder="Semester" min="1" max="8" />
                  <button onClick={addSubject} className="flex items-center space-x-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20">
                    <Plus className="w-4 h-4" /><span>Add</span>
                  </button>
                </div>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
                {subjects.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-slate-500">No subjects yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[500px]">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-400">
                          <th className="text-left px-5 py-3 font-medium">Subject</th>
                          <th className="text-left px-5 py-3 font-medium">Code</th>
                          <th className="text-left px-5 py-3 font-medium">Course</th>
                          <th className="text-center px-5 py-3 font-medium">Semester</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map(s => (
                          <tr key={s._id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                            <td className="px-5 py-3 font-medium text-white">{s.name}</td>
                            <td className="px-5 py-3 text-emerald-400 font-mono">{s.code}</td>
                            <td className="px-5 py-3 text-slate-300">{typeof s.course_id === 'object' ? s.course_id?.name : '-'}</td>
                            <td className="px-5 py-3 text-center text-slate-300">{s.semester || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
