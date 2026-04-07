import { useState, useEffect } from 'react';
import { studentApi } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Spinner } from '../../components/ui/spinner';
import { Badge } from '../../components/ui/badge';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';

interface AttendanceData {
  subject: { _id: string; name: string; code: string };
  total: number;
  present: number;
  absent: number;
  percentage: number;
  records: Array<{ date: string; status: string; session: string }>;
}

export default function StudentAttendance() {
  const [attendance, setAttendance] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await studentApi.getAttendance();
        setAttendance(response.data.data);
      } catch (err) {
        console.error('Failed to fetch attendance:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 75) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6" data-testid="student-attendance">
      <div>
        <h1 className="text-2xl font-bold">My Attendance</h1>
        <p className="text-muted-foreground">View your subject-wise attendance summary</p>
      </div>

      {attendance.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No attendance records found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {attendance.map((item) => (
            <Card key={item.subject._id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{item.subject.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{item.subject.code}</p>
                  </div>
                  <Badge className={getPercentageColor(item.percentage)}>
                    {item.percentage}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-2xl font-bold">{item.total}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">{item.present}</div>
                    <div className="text-xs text-muted-foreground">Present</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="text-2xl font-bold text-red-600">{item.absent}</div>
                    <div className="text-xs text-muted-foreground">Absent</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.percentage >= 75 ? 'bg-green-500' : item.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>

                {item.percentage < 75 && (
                  <p className="text-xs text-red-600 mt-2">
                    ⚠️ Below 75% attendance requirement
                  </p>
                )}

                {/* Recent records */}
                {item.records.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Recent Records</p>
                    <div className="flex flex-wrap gap-1">
                      {item.records.slice(0, 5).map((record, idx) => (
                        <div
                          key={idx}
                          className={`p-1 rounded ${
                            record.status === 'present' || record.status === 'od'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                          title={`${new Date(record.date).toLocaleDateString()} - ${record.status}`}
                        >
                          {record.status === 'present' || record.status === 'od' ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
