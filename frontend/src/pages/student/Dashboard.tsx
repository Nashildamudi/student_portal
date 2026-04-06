import React, { useState, useEffect } from 'react';
import { LogOut, LayoutDashboard, Calendar, ClipboardList, FolderOpen, BookOpen, Menu, Download, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

type Page = 'dashboard' | 'attendance' | 'marks' | 'materials';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [page, setPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [marks, setMarks] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // Load profile once on mount
  useEffect(() => {
    api.get('/student/profile').then((r) => setProfile(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (page === 'attendance') {
      setLoading(true);
      api.get('/student/attendance').then((r) => setAttendance(r.data.data)).catch(() => {}).finally(() => setLoading(false));
    } else if (page === 'marks') {
      setLoading(true);
      api.get('/student/marks').then((r) => setMarks(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
    } else if (page === 'materials') {
      setLoading(true);
      api.get('/student/materials').then((r) => setMaterials(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
    }
  }, [page]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'marks', label: 'Marks', icon: ClipboardList },
    { id: 'materials', label: 'Materials', icon: FolderOpen },
  ];

  const getAttendanceBadge = (pct: number) => {
    if (pct >= 85) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (pct >= 75) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
    return 'bg-red-500/20 text-red-300 border-red-500/40';
  };
  const getAttendanceBar = (pct: number) =>
    pct >= 85 ? 'bg-emerald-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-red-500';
  const getAttendanceLabel = (pct: number) =>
    pct >= 85 ? 'Good' : pct >= 75 ? 'Low' : 'Critical';

  return (
    <div className="min-h-screen flex bg-slate-900 text-white">
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed md:relative z-30 md:z-auto w-64 bg-slate-800 border-r border-slate-700 flex flex-col h-screen transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-5 border-b border-slate-700 flex items-center space-x-3">
          <BookOpen className="text-indigo-400 w-6 h-6 flex-shrink-0" />
          <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Student Portal</h1>
        </div>
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
              {user.name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white truncate">{user.name || 'Student'}</p>
              <p className="text-xs text-indigo-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => { setPage(item.id as Page); setSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-left ${page === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>
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

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700 px-6 py-4 flex items-center sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg mr-3">
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-white capitalize">{page}</h2>
        </header>

        <div className="flex-1 overflow-y-auto p-6">

          {/* Dashboard Overview */}
          {page === 'dashboard' && (
            <div>
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-1">Welcome back, {user.name?.split(' ')[0] || 'Student'}! 👋</h3>
                <p className="text-slate-400">Here's your academic summary.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                {[
                  { label: 'View Attendance', icon: Calendar, color: 'emerald', page: 'attendance', desc: 'Check your attendance %' },
                  { label: 'View Marks', icon: ClipboardList, color: 'purple', page: 'marks', desc: 'View subject-wise marks' },
                  { label: 'Study Materials', icon: FolderOpen, color: 'blue', page: 'materials', desc: 'Download PDFs from teachers' },
                ].map((card) => (
                  <button key={card.page} onClick={() => setPage(card.page as Page)}
                    className="bg-slate-800 border border-slate-700 hover:border-indigo-500/50 p-6 rounded-2xl text-left transition-all group shadow-lg">
                    <card.icon className={`w-10 h-10 mb-4 text-${card.color}-400 group-hover:scale-110 transition-transform`} />
                    <p className="font-bold text-white text-lg">{card.label}</p>
                    <p className="text-slate-400 text-sm mt-1">{card.desc}</p>
                  </button>
                ))}
              </div>

              {/* Profile Card */}
              <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl">
                <h4 className="font-bold text-white mb-4">Your Profile</h4>
                {!profile ? (
                  <div className="flex items-center space-x-2 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /><span>Loading profile...</span></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    {[
                      ['Name', user.name || '—'],
                      ['Email', user.email || '—'],
                      ['Roll Number', profile?.roll_number || '—'],
                      ['Department', profile?.department_id?.name || '—'],
                      ['Course', profile?.course_id?.name || '—'],
                      ['Semester', profile?.semester ? `Semester ${profile.semester}` : '—'],
                      ['Section', profile?.section ? `Section ${profile.section}` : '—'],
                      ['Academic Year', profile?.academic_year || '—'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between py-2.5 border-b border-slate-700">
                        <span className="text-slate-400">{k}</span>
                        <span className="text-white font-medium text-right ml-2">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Attendance */}
          {page === 'attendance' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Attendance Overview</h3>
              {loading ? (
                <div className="flex items-center justify-center h-48 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mr-3" /><span>Loading...</span></div>
              ) : !attendance ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                  <Calendar className="w-12 h-12 mb-3 opacity-30" />
                  <p>No attendance records found.</p>
                </div>
              ) : (attendance.summary || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                  <Calendar className="w-12 h-12 mb-3 opacity-30" />
                  <p>No attendance records yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(attendance.summary || []).map((s: any) => (
                    <div key={s.subject._id} className="bg-slate-800 border border-slate-700 p-5 rounded-2xl">
                      <p className="text-slate-400 text-xs mb-1 font-mono">{s.subject.code}</p>
                      <p className="font-bold text-white text-base mb-1">{s.subject.name}</p>
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <p className="text-3xl font-bold text-white">{s.percentage}%</p>
                          <p className="text-xs text-slate-400 mt-0.5">{s.present}/{s.total} classes attended</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getAttendanceBadge(s.percentage)}`}>
                          {getAttendanceLabel(s.percentage)}
                        </span>
                      </div>
                      <div className="bg-slate-700 rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all ${getAttendanceBar(s.percentage)}`} style={{ width: `${s.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Marks */}
          {page === 'marks' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Your Marks</h3>
              {loading ? (
                <div className="flex items-center justify-center h-48 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mr-3" /><span>Loading...</span></div>
              ) : marks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                  <ClipboardList className="w-12 h-12 mb-3 opacity-30" />
                  <p>No marks recorded yet.</p>
                </div>
              ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400">
                        <th className="text-left px-5 py-3 font-medium">Subject</th>
                        <th className="text-left px-5 py-3 font-medium">Component</th>
                        <th className="text-center px-5 py-3 font-medium">Type</th>
                        <th className="text-center px-5 py-3 font-medium">Marks</th>
                        <th className="text-center px-5 py-3 font-medium">Max</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marks.map((m: any) => {
                        const subjectName = m.component_id?.assignment_id?.subject_id?.name || '—';
                        return (
                          <tr key={m._id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                            <td className="px-5 py-3 text-white font-medium">{subjectName}</td>
                            <td className="px-5 py-3 text-slate-300">{m.component_id?.name || '—'}</td>
                            <td className="px-5 py-3 text-center">
                              {m.component_id?.type && (
                                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">{m.component_id.type}</span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-center text-indigo-300 font-bold">{m.marks_obtained}</td>
                            <td className="px-5 py-3 text-center text-slate-400">{m.component_id?.max_marks || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Materials */}
          {page === 'materials' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Study Materials</h3>
              {loading ? (
                <div className="flex items-center justify-center h-48 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mr-3" /><span>Loading...</span></div>
              ) : materials.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                  <FolderOpen className="w-12 h-12 mb-3 opacity-30" />
                  <p>No materials uploaded yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {materials.map((m: any) => (
                    <div key={m._id} className="bg-slate-800 border border-slate-700 hover:border-indigo-500/50 p-5 rounded-2xl transition-all group">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FolderOpen className="w-5 h-5 text-red-400" />
                        </div>
                        <span className="text-xs text-slate-500">{new Date(m.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold text-white mb-1">{m.title}</h4>
                      <p className="text-xs text-indigo-400 mb-1">{m.subject_id?.name} ({m.subject_id?.code})</p>
                      <p className="text-xs text-slate-500 mb-4">by {m.uploaded_by?.name}</p>
                      <a href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${m.filepath}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center space-x-2 w-full py-2 px-3 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 rounded-xl text-indigo-300 text-sm font-medium transition-all">
                        <Download className="w-4 h-4" />
                        <span>Download PDF</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
