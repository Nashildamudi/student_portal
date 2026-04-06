import React, { useState, useEffect } from 'react';
import { Calendar, Check, X, Clock, AlertTriangle, Loader2, Users, Lock } from 'lucide-react';
import api from '../../api';

type AttendanceStatus = 'present' | 'absent' | 'od' | 'medical_leave';

interface Student {
  _id: string;
  name: string;
  email: string;
  roll_number: string;
}

interface AttendanceSummary {
  student_id: string;
  name: string;
  roll_number: string;
  total: number;
  present: number;
  percentage: number;
}

const statusConfig: Record<AttendanceStatus, { label: string; color: string; activeColor: string }> = {
  present: { label: 'Present', color: 'bg-slate-700 text-slate-400', activeColor: 'bg-emerald-600 text-white shadow-emerald-500/20 shadow-lg' },
  absent: { label: 'Absent', color: 'bg-slate-700 text-slate-400', activeColor: 'bg-red-600 text-white shadow-red-500/20 shadow-lg' },
  od: { label: 'OD', color: 'bg-slate-700 text-slate-400', activeColor: 'bg-amber-500 text-white shadow-amber-500/20 shadow-lg' },
  medical_leave: { label: 'Medical', color: 'bg-slate-700 text-slate-400', activeColor: 'bg-blue-600 text-white shadow-blue-500/20 shadow-lg' },
};

interface Props {
  assignments: any[];
}

const Attendance: React.FC<Props> = ({ assignments }) => {
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState('Morning');
  const [students, setStudents] = useState<Student[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({});
  const [lockedRecords, setLockedRecords] = useState<any[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [summary, setSummary] = useState<AttendanceSummary[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 4000);
  };

  // Load students when assignment changes
  useEffect(() => {
    if (!selectedAssignment) {
      setStudents([]);
      return;
    }
    setLoadingStudents(true);
    api.get(`/faculty/students/${selectedAssignment}`)
      .then((res) => {
        const s = res.data.data || [];
        setStudents(s);
        const init: Record<string, AttendanceStatus> = {};
        s.forEach((st: Student) => { init[st._id] = 'present'; });
        setStatusMap(init);
      })
      .finally(() => setLoadingStudents(false));
  }, [selectedAssignment]);

  // Check if already submitted when assignment/date/session changes
  useEffect(() => {
    if (!selectedAssignment || !date || !session) return;
    setLoadingCheck(true);
    api.get(`/faculty/attendance/${selectedAssignment}/date?date=${date}&session=${session}`)
      .then((res) => {
        const records = res.data.data || [];
        if (records.length > 0) {
          setIsLocked(true);
          setLockedRecords(records);
        } else {
          setIsLocked(false);
          setLockedRecords([]);
        }
      })
      .catch(() => { setIsLocked(false); setLockedRecords([]); })
      .finally(() => setLoadingCheck(false));
  }, [selectedAssignment, date, session]);

  // Load attendance summary
  useEffect(() => {
    if (!selectedAssignment) { setSummary([]); return; }
    api.get(`/faculty/attendance/${selectedAssignment}`)
      .then((res) => {
        const records = res.data.data || [];
        const map: Record<string, { name: string; roll: string; total: number; present: number }> = {};
        records.forEach((r: any) => {
          const sid = r.student_id?._id || r.student_id;
          if (!sid) return;
          if (!map[sid]) map[sid] = { name: r.student_id?.name || 'Unknown', roll: r.student_id?.roll_number || '', total: 0, present: 0 };
          map[sid].total++;
          if (r.status === 'present' || r.status === 'od') map[sid].present++;
        });
        setSummary(Object.entries(map).map(([id, v]) => ({
          student_id: id,
          name: v.name,
          roll_number: v.roll,
          total: v.total,
          present: v.present,
          percentage: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0,
        })));
      });
  }, [selectedAssignment, submitting]);

  const setAll = (status: AttendanceStatus) => {
    const newMap: Record<string, AttendanceStatus> = {};
    students.forEach((s) => { newMap[s._id] = status; });
    setStatusMap(newMap);
  };

  const submitAttendance = async () => {
    if (!selectedAssignment || students.length === 0) return;
    setSubmitting(true);
    try {
      const records = students.map((s) => ({ student_id: s._id, status: statusMap[s._id] || 'absent' }));
      await api.post('/faculty/attendance', { assignment_id: selectedAssignment, date, session, records });
      showMsg('Attendance submitted successfully!', 'success');
      setIsLocked(true);
      setLockedRecords(records);
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Failed to submit attendance';
      showMsg(msg.includes('duplicate') ? 'Attendance for this date and session is already recorded.' : msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getBgColor = (pct: number) => pct >= 85 ? 'bg-emerald-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-red-500';
  const getBadge = (pct: number) => pct >= 85
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    : pct >= 75
      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
      : 'bg-red-500/20 text-red-300 border-red-500/40';

  const selectClass = 'w-full px-3 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all';

  return (
    <div className="max-w-5xl space-y-6">
      <h3 className="text-xl font-bold text-white">Mark Attendance</h3>

      {msg && (
        <div className={`p-4 rounded-xl text-sm ${msgType === 'success' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/20 border border-red-500/30 text-red-300'}`}>
          {msg}
        </div>
      )}

      {/* Controls */}
      <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Select Subject</label>
            <select value={selectedAssignment} onChange={(e) => setSelectedAssignment(e.target.value)} className={selectClass}>
              <option value="">— Choose Assignment —</option>
              {assignments.map((a: any) => (
                <option key={a._id} value={a._id}>{a.subject_id?.name} — Sem {a.semester} Sec {a.section}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Session</label>
            <select value={session} onChange={(e) => setSession(e.target.value)} className={selectClass}>
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={`Period ${n}`}>Period {n}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Loading states */}
      {(loadingStudents || loadingCheck) && (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-3" />
          <span>{loadingStudents ? 'Loading students...' : 'Checking attendance...'}</span>
        </div>
      )}

      {/* Locked / Already Submitted */}
      {!loadingStudents && !loadingCheck && selectedAssignment && isLocked && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center space-x-3 bg-amber-500/10">
            <Lock className="w-5 h-5 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-300">Attendance Already Submitted</p>
              <p className="text-xs text-slate-400">Attendance for {date} ({session}) is locked.</p>
            </div>
          </div>
          <div className="divide-y divide-slate-700/50">
            {lockedRecords.map((r: any) => {
              const st = students.find((s) => s._id === (r.student_id?._id || r.student_id));
              return (
                <div key={r._id || r.student_id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-white text-sm font-medium">{r.student_id?.name || st?.name || 'Student'}</p>
                    <p className="text-xs text-slate-500">{st?.roll_number}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${r.status === 'present' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : r.status === 'od' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : r.status === 'medical_leave' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-red-500/20 text-red-300 border-red-500/40'}`}>
                    {r.status.replace('_', ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Attendance Form */}
      {!loadingStudents && !loadingCheck && selectedAssignment && !isLocked && students.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-teal-400" />
              <h4 className="font-bold text-white">Students ({students.length})</h4>
            </div>
            <div className="flex space-x-2">
              {(Object.keys(statusConfig) as AttendanceStatus[]).slice(0, 2).map((s) => (
                <button key={s} onClick={() => setAll(s)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${s === 'present' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'}`}>
                  All {statusConfig[s].label}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-slate-700/50">
            {students.map((s) => (
              <div key={s._id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-700/20 transition-colors">
                <div>
                  <p className="font-medium text-white">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.roll_number || s.email}</p>
                </div>
                <div className="flex space-x-2">
                  {(Object.entries(statusConfig) as [AttendanceStatus, typeof statusConfig[AttendanceStatus]][]).map(([status, cfg]) => (
                    <button key={status} onClick={() => setStatusMap((prev) => ({ ...prev, [s._id]: status }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${statusMap[s._id] === status ? cfg.activeColor : cfg.color + ' hover:bg-slate-600'}`}>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Present: {Object.values(statusMap).filter((s) => s === 'present').length} /
              Absent: {Object.values(statusMap).filter((s) => s === 'absent').length} /
              OD: {Object.values(statusMap).filter((s) => s === 'od').length} /
              Medical: {Object.values(statusMap).filter((s) => s === 'medical_leave').length}
            </p>
            <button onClick={submitAttendance} disabled={submitting}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-all disabled:opacity-60 flex items-center space-x-2 shadow-lg shadow-teal-500/20">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Submitting...</span></> : <><Check className="w-4 h-4" /><span>Submit Attendance</span></>}
            </button>
          </div>
        </div>
      )}

      {!loadingStudents && selectedAssignment && students.length === 0 && !loadingCheck && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <AlertTriangle className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">No students found for this assignment.</p>
          <p className="text-xs mt-1">Ensure students are enrolled in Sem {assignments.find((a) => a._id === selectedAssignment)?.semester} Sec {assignments.find((a) => a._id === selectedAssignment)?.section}.</p>
        </div>
      )}

      {/* Attendance Summary */}
      {summary.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h4 className="font-bold text-white flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-teal-400" />
              <span>Attendance Summary</span>
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
                  <th className="text-left px-5 py-3">Student</th>
                  <th className="text-center px-5 py-3">Total</th>
                  <th className="text-center px-5 py-3">Present</th>
                  <th className="text-center px-5 py-3">%</th>
                  <th className="px-5 py-3">Progress</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s) => (
                  <tr key={s.student_id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.roll_number}</p>
                    </td>
                    <td className="px-5 py-3 text-center text-slate-300">{s.total}</td>
                    <td className="px-5 py-3 text-center text-slate-300">{s.present}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getBadge(s.percentage)}`}>{s.percentage}%</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="w-full bg-slate-700 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${getBgColor(s.percentage)}`} style={{ width: `${s.percentage}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
