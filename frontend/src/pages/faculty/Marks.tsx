import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Loader2, AlertTriangle, ClipboardList } from 'lucide-react';
import api from '../../api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Component {
  _id: string;
  name: string;
  max_marks: number;
  type: string;
}

interface Student {
  _id: string;
  name: string;
  roll_number: string;
  email: string;
}

interface Props {
  assignments: any[];
}

const componentTypes = ['Internal', 'Assignment', 'Quiz', 'Project', 'Other'] as const;

const Marks: React.FC<Props> = ({ assignments }) => {
  const [activeTab, setActiveTab] = useState<'components' | 'marks'>('components');
  const [selectedAssignment, setSelectedAssignment] = useState('');

  // Components tab
  const [components, setComponents] = useState<Component[]>([]);
  const [loadingComponents, setLoadingComponents] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompMax, setNewCompMax] = useState('');
  const [newCompType, setNewCompType] = useState<typeof componentTypes[number]>('Internal');
  const [addingComp, setAddingComp] = useState(false);

  // Marks tab
  const [selectedComponent, setSelectedComponent] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [marksMap, setMarksMap] = useState<Record<string, string>>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);

  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 4000);
  };

  // Load components when assignment changes
  useEffect(() => {
    if (!selectedAssignment) { setComponents([]); return; }
    setLoadingComponents(true);
    api.get(`/faculty/marks/components/${selectedAssignment}`)
      .then((res) => setComponents(res.data.data || []))
      .finally(() => setLoadingComponents(false));
  }, [selectedAssignment]);

  // Load students when assignment changes (for marks tab)
  useEffect(() => {
    if (!selectedAssignment) { setStudents([]); return; }
    setLoadingStudents(true);
    api.get(`/faculty/students/${selectedAssignment}`)
      .then((res) => setStudents(res.data.data || []))
      .finally(() => setLoadingStudents(false));
  }, [selectedAssignment]);

  // Pre-fill marks when component is selected
  useEffect(() => {
    if (!selectedAssignment || !selectedComponent) { setMarksMap({}); return; }
    setLoadingMarks(true);
    api.get(`/faculty/marks/${selectedAssignment}`)
      .then((res) => {
        const allMarks = res.data.data || [];
        const filtered = allMarks.filter((m: any) => {
          const cid = m.component_id?._id || m.component_id;
          return cid === selectedComponent;
        });
        const map: Record<string, string> = {};
        filtered.forEach((m: any) => {
          const sid = m.student_id?._id || m.student_id;
          if (sid) map[sid] = String(m.marks_obtained);
        });
        setMarksMap(map);
      })
      .finally(() => setLoadingMarks(false));
  }, [selectedComponent, selectedAssignment]);

  const addComponent = async () => {
    if (!selectedAssignment || !newCompName || !newCompMax) return;
    setAddingComp(true);
    try {
      const res = await api.post('/faculty/marks/components', {
        assignment_id: selectedAssignment,
        name: newCompName,
        max_marks: parseInt(newCompMax),
        type: newCompType,
      });
      setComponents((prev) => [...prev, res.data.data]);
      setNewCompName('');
      setNewCompMax('');
      setNewCompType('Internal');
      showMsg('Component added successfully!', 'success');
    } catch (e: any) {
      showMsg(e.response?.data?.message || 'Failed to add component', 'error');
    } finally {
      setAddingComp(false);
    }
  };

  const deleteComponent = async (id: string) => {
    if (!confirm('Delete this mark component? Existing marks for it will also be affected.')) return;
    try {
      await api.delete(`/faculty/marks/components/${id}`);
      setComponents((prev) => prev.filter((c) => c._id !== id));
      if (selectedComponent === id) setSelectedComponent('');
      showMsg('Component deleted.', 'success');
    } catch {
      showMsg('Failed to delete component.', 'error');
    }
  };

  const saveMarks = async () => {
    const comp = components.find((c) => c._id === selectedComponent);
    if (!comp) return;
    const entered = Object.entries(marksMap).filter(([, v]) => v !== '');
    if (entered.length === 0) {
      showMsg('No marks entered.', 'error');
      return;
    }
    // Validate max marks
    for (const [, v] of entered) {
      const n = parseFloat(v);
      if (isNaN(n) || n < 0 || n > comp.max_marks) {
        showMsg(`Marks must be between 0 and ${comp.max_marks}.`, 'error');
        return;
      }
    }
    setSavingMarks(true);
    try {
      const data = entered.map(([student_id, marks_obtained]) => ({
        student_id,
        component_id: selectedComponent,
        marks_obtained: parseFloat(marks_obtained),
        assignment_id: selectedAssignment,
      }));
      await api.post('/faculty/marks', data);
      showMsg('Marks saved successfully!', 'success');
    } catch (e: any) {
      showMsg(e.response?.data?.message || 'Failed to save marks.', 'error');
    } finally {
      setSavingMarks(false);
    }
  };

  const selectedComp = components.find((c) => c._id === selectedComponent);
  const selectClass = 'w-full px-3 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all disabled:opacity-50';
  const inputClass = 'px-3 py-2 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all';

  return (
    <div className="max-w-5xl space-y-6">
      <h3 className="text-xl font-bold text-white">Marks & Evaluation</h3>

      {msg && (
        <div className={`p-4 rounded-xl text-sm ${msgType === 'success' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/20 border border-red-500/30 text-red-300'}`}>
          {msg}
        </div>
      )}

      {/* Assignment Selector */}
      <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl">
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Select Teaching Assignment</label>
        <select value={selectedAssignment} onChange={(e) => { setSelectedAssignment(e.target.value); setSelectedComponent(''); }} className={selectClass}>
          <option value="">— Choose an Assignment —</option>
          {assignments.map((a: any) => (
            <option key={a._id} value={a._id}>{a.subject_id?.name} ({a.subject_id?.code}) — Sem {a.semester} Sec {a.section}</option>
          ))}
        </select>
      </div>

      {selectedAssignment && (
        <>
          {/* Tab switcher */}
          <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1">
            {(['components', 'marks'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white'}`}>
                {tab === 'components' ? '📋 Mark Components' : '✏️ Enter Marks'}
              </button>
            ))}
          </div>

          {/* Tab 1: Components */}
          {activeTab === 'components' && (
            <div className="space-y-4">
              {/* Add Component */}
              <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl">
                <h4 className="font-semibold text-white mb-4 text-sm">Add New Component</h4>
                <div className="flex flex-wrap gap-3">
                  <input value={newCompName} onChange={(e) => setNewCompName(e.target.value)}
                    className={`${inputClass} flex-1 min-w-[140px]`} placeholder="Component name (e.g. Internal 1)" />
                  <input type="number" value={newCompMax} onChange={(e) => setNewCompMax(e.target.value)}
                    className={`${inputClass} w-24`} placeholder="Max" min="1" />
                  <select value={newCompType} onChange={(e) => setNewCompType(e.target.value as any)} className={`${inputClass} w-36`}>
                    {componentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={addComponent} disabled={addingComp || !newCompName || !newCompMax}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-xl transition-all disabled:opacity-60">
                    {addingComp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Components list */}
              {loadingComponents ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
              ) : components.length === 0 ? (
                <div className="flex flex-col items-center py-14 text-slate-500">
                  <ClipboardList className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm">No mark components yet. Add one above.</p>
                </div>
              ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
                  <div className="divide-y divide-slate-700/50">
                    {components.map((c) => (
                      <div key={c._id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-700/20 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium text-white">{c.name}</p>
                            <p className="text-xs text-slate-400">Max Marks: {c.max_marks}</p>
                          </div>
                          <span className="px-2.5 py-1 text-xs rounded-full border bg-purple-500/20 text-purple-300 border-purple-500/40">{c.type}</span>
                        </div>
                        <button onClick={() => deleteComponent(c._id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Enter Marks */}
          {activeTab === 'marks' && (
            <div className="space-y-4">
              <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Select Mark Component</label>
                <select value={selectedComponent} onChange={(e) => setSelectedComponent(e.target.value)} className={selectClass} disabled={components.length === 0}>
                  <option value="">{components.length === 0 ? '— No components (add in Components tab) —' : '— Select Component —'}</option>
                  {components.map((c) => (
                    <option key={c._id} value={c._id}>{c.name} (Max: {c.max_marks})</option>
                  ))}
                </select>
              </div>

              {loadingStudents || loadingMarks ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
              ) : selectedComponent && students.length > 0 ? (
                <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-white">{selectedComp?.name}</h4>
                      <p className="text-xs text-slate-400">Max marks: {selectedComp?.max_marks} | {students.length} students</p>
                    </div>
                    <Button onClick={saveMarks} disabled={savingMarks} className="bg-purple-600 hover:bg-purple-700">
                      {savingMarks ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save All Marks</>}
                    </Button>
                  </div>
                  <div className="divide-y divide-slate-700/50">
                    {students.map((s) => {
                      const val = marksMap[s._id] !== undefined ? marksMap[s._id] : '';
                      const numVal = parseFloat(val);
                      const isInvalid = val !== '' && (isNaN(numVal) || numVal < 0 || numVal > (selectedComp?.max_marks || 100));
                      return (
                        <div key={s._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-700/20">
                          <div>
                            <p className="font-medium text-white">{s.name}</p>
                            <p className="text-xs text-slate-500">{s.roll_number || s.email}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-xs text-slate-500">/ {selectedComp?.max_marks}</span>
                            <input type="number" min="0" max={selectedComp?.max_marks} step="0.5"
                              value={val}
                              onChange={(e) => setMarksMap((prev) => ({ ...prev, [s._id]: e.target.value }))}
                              placeholder="—"
                              className={`w-20 text-center px-2 py-1.5 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 transition-all ${isInvalid ? 'bg-red-900/40 border border-red-500 text-red-300 focus:ring-red-500' : 'bg-slate-700 border border-slate-600 text-white focus:ring-purple-500'}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-5 py-4 border-t border-slate-700 flex justify-end">
                    <Button onClick={saveMarks} disabled={savingMarks} className="bg-purple-600 hover:bg-purple-700">
                      {savingMarks ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save All Marks</>}
                    </Button>
                  </div>
                </div>
              ) : selectedComponent && students.length === 0 ? (
                <div className="flex flex-col items-center py-14 text-slate-500">
                  <AlertTriangle className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No students found for this assignment.</p>
                </div>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Marks;
