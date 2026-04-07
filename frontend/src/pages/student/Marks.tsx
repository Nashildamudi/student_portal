import { useState, useEffect } from 'react';
import { studentApi } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Spinner } from '../../components/ui/spinner';
import { Badge } from '../../components/ui/badge';
import { Award } from 'lucide-react';

interface MarkData {
  subject: { _id: string; name: string; code: string };
  components: Array<{
    _id: string;
    name: string;
    maxMarks: number;
    type: string;
    marksObtained: number | null;
    remarks: string;
  }>;
  totalMax: number;
  totalObtained: number;
  percentage: number;
}

export default function StudentMarks() {
  const [marks, setMarks] = useState<MarkData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarks = async () => {
      try {
        const response = await studentApi.getMarks();
        setMarks(response.data.data);
      } catch (err) {
        console.error('Failed to fetch marks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMarks();
  }, []);

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A+', color: 'bg-green-500' };
    if (percentage >= 80) return { grade: 'A', color: 'bg-green-400' };
    if (percentage >= 70) return { grade: 'B+', color: 'bg-blue-500' };
    if (percentage >= 60) return { grade: 'B', color: 'bg-blue-400' };
    if (percentage >= 50) return { grade: 'C', color: 'bg-yellow-500' };
    if (percentage >= 40) return { grade: 'D', color: 'bg-orange-500' };
    return { grade: 'F', color: 'bg-red-500' };
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6" data-testid="student-marks">
      <div>
        <h1 className="text-2xl font-bold">My Marks</h1>
        <p className="text-muted-foreground">View your subject-wise marks and grades</p>
      </div>

      {marks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Award className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No marks records found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {marks.map((item) => {
            const { grade, color } = getGrade(item.percentage);
            
            return (
              <Card key={item.subject._id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{item.subject.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{item.subject.code}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={`${color} text-white`}>{grade}</Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.totalObtained}/{item.totalMax} ({item.percentage}%)
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {item.components.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Component</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Max</TableHead>
                          <TableHead className="text-right">Obtained</TableHead>
                          <TableHead className="text-right">%</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {item.components.map((comp) => {
                          const compPercentage = comp.marksObtained !== null 
                            ? Math.round((comp.marksObtained / comp.maxMarks) * 100)
                            : null;
                          
                          return (
                            <TableRow key={comp._id}>
                              <TableCell className="font-medium">{comp.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">{comp.type}</Badge>
                              </TableCell>
                              <TableCell className="text-right">{comp.maxMarks}</TableCell>
                              <TableCell className="text-right">
                                {comp.marksObtained !== null ? comp.marksObtained : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                {compPercentage !== null ? (
                                  <span className={compPercentage >= 50 ? 'text-green-600' : 'text-red-600'}>
                                    {compPercentage}%
                                  </span>
                                ) : '-'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No components defined yet.</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
