import React, { useState, useEffect, useRef } from 'react';
import { LogOut, LayoutDashboard, Calendar, ClipboardList, Upload, BookOpen, Menu, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import Attendance from './Attendance';
import Marks from './Marks';

type Page = 'dashboard' | 'attendance' | 'marks' | 'materials';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [page, setPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  useEffect(() => {
    api.get('/faculty/assignments').then((r) => setAssignments(r.data.data || []));
    api.get('/faculty/subjects').then((r) => setSubjects(r.data.data || []));
  }, []);

  useEffect(() => {
    if (uploadSubject) {
      api.get(`/faculty/materials/${uploadSubject}`).then((r) => setMaterials(r.data.data || []));
    }
  }, [uploadSubject]);

  const uploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle || !uploadSubject) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('title', uploadTitle);
      fd.append('subject_id', uploadSubject);
      await api.post('/faculty/materials', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg('Material uploaded!');
      setUploadTitle('');
      setUploadFile(null);
      if (fileRef.current) fileRef.current.value = '';
      api.get(`/faculty/materials/${uploadSubject}`).then((r) => setMaterials(r.data.data || []));
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'marks', label: 'Marks', icon: ClipboardList },
    { id: 'materials', label: 'Materials', icon: Upload },
  ];

  const selectClass = 'w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all';
  const inputClass = 'px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all';

  return (
    <div className="min-h-screen flex bg-slate-900 text-white">
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed md:relative z-30 md:z-auto w-64 bg-slate-800 border-r border-slate-700 flex flex-col h-screen transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-5 border-b border-slate-700 flex items-center space-x-3">
          <BookOpen className="text-teal-400 w-6 h-6 flex-shrink-0" />
          <h1 className="text-lg font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">Faculty Portal</h1>
        </div>
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
              {user.name?.charAt(0).toUpperCase() || 'F'}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white truncate">{user.name || 'Faculty'}</p>
              <p className="text-xs text-teal-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => { setPage(item.id as Page); setSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-left ${page === item.id ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>
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
            <h2 className="text-xl font-bold text-white capitalize">{page}</h2>
          </div>
          {msg && <span className={`text-sm px-3 py-1.5 rounded-lg ${msg.includes('success') || msg.includes('uploaded') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>{msg}</span>}
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Dashboard overview */}
          {page === 'dashboard' && (
            <div>
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-1">Welcome, {user.name?.split(' ')[0] || 'Faculty'}! 👋</h3>
                <p className="text-slate-400">Manage your classes, attendance, marks and materials.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                {[
                  { label: 'Mark Attendance', icon: Calendar, color: 'teal', page: 'attendance', desc: 'Record daily class attendance' },
                  { label: 'Enter Marks', icon: ClipboardList, color: 'purple', page: 'marks', desc: 'Add marks per component' },
                  { label: 'Upload Materials', icon: Upload, color: 'blue', page: 'materials', desc: 'Share PDFs with students' },
                ].map((card) => (
                  <button key={card.page} onClick={() => setPage(card.page as Page)}
                    className="bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-teal-500/50 p-6 rounded-2xl text-left transition-all group shadow-lg">
                    <card.icon className={`w-10 h-10 mb-4 text-${card.color}-400 group-hover:scale-110 transition-transform`} />
                    <p className="font-bold text-white text-lg">{card.label}</p>
                    <p className="text-slate-400 text-sm mt-1">{card.desc}</p>
                  </button>
                ))}
              </div>
              <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl">
                <h4 className="font-bold text-white mb-4 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-teal-400" />
                  <span>My Assignments ({assignments.length})</span>
                </h4>
                {assignments.length === 0 ? (
                  <p className="text-slate-500 text-sm">No teaching assignments yet. Contact admin to get assigned subjects.</p>
                ) : (
                  <div className="space-y-2">
                    {assignments.map((a: any) => (
                      <div key={a._id} className="flex items-center justify-between py-3 px-4 bg-slate-700/50 rounded-xl">
                        <div>
                          <span className="text-white font-medium">{a.subject_id?.name || 'Subject'}</span>
                          <span className="text-slate-400 text-sm ml-2">· Sem {a.semester} Sec {a.section}</span>
                        </div>
                        <span className="text-xs text-teal-400 bg-teal-500/10 px-2 py-1 rounded-full">{a.subject_id?.code}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Attendance page — delegated to Attendance component */}
          {page === 'attendance' && <Attendance assignments={assignments} />}

          {/* Marks page — delegated to Marks component */}
          {page === 'marks' && <Marks assignments={assignments} />}

          {/* Materials */}
          {page === 'materials' && (
            <div className="max-w-4xl">
              <h3 className="text-xl font-bold text-white mb-6">Upload Study Materials</h3>
              <form onSubmit={uploadMaterial} className="bg-slate-800 border border-slate-700 p-6 rounded-2xl mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Select Subject</label>
                    <select value={uploadSubject} onChange={(e) => setUploadSubject(e.target.value)} className={selectClass}>
                      <option value="">— Select Subject —</option>
                      {subjects.map((s: any) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Material Title</label>
                    <input type="text" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} required
                      className={`w-full ${inputClass}`} placeholder="e.g. Chapter 1 - Introduction" />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-slate-400 mb-2">PDF File (max 20MB)</label>
                  <input ref={fileRef} type="file" accept=".pdf" onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-teal-600 file:text-white hover:file:bg-teal-700 file:transition-colors" />
                </div>
                <button type="submit" disabled={loading || !uploadFile || !uploadTitle || !uploadSubject}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-all disabled:opacity-60 shadow-lg shadow-teal-500/20">
                  <Upload className="w-4 h-4" /><span>{loading ? 'Uploading...' : 'Upload PDF'}</span>
                </button>
              </form>
              {materials.length > 0 && (
                <div>
                  <h4 className="font-semibold text-white mb-4">Uploaded Materials</h4>
                  <div className="space-y-3">
                    {materials.map((m: any) => (
                      <div key={m._id} className="flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-xl">
                        <div>
                          <p className="font-medium text-white">{m.title}</p>
                          <p className="text-xs text-slate-400">{m.subject_id?.name} · {new Date(m.createdAt).toLocaleDateString()}</p>
                        </div>
                        <a href={`http://localhost:5000${m.filepath}`} target="_blank" rel="noopener noreferrer"
                          className="text-xs px-3 py-1.5 bg-teal-500/20 text-teal-300 border border-teal-500/40 rounded-lg hover:bg-teal-500/30 transition-colors">
                          View PDF
                        </a>
                      </div>
                    ))}
                  </div>
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
