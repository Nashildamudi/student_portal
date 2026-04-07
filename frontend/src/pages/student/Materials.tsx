import { useState, useEffect } from 'react';
import { studentApi } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Spinner } from '../../components/ui/spinner';
import { Badge } from '../../components/ui/badge';
import type { Material } from '../../types';
import { FolderOpen, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function StudentMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await studentApi.getMaterials();
        setMaterials(response.data.data);
      } catch (err) {
        console.error('Failed to fetch materials:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  const apiUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

  // Group materials by subject
  const materialsBySubject = materials.reduce((acc, material) => {
    const subjectName = material.subject?.name || 'Unknown';
    if (!acc[subjectName]) acc[subjectName] = [];
    acc[subjectName].push(material);
    return acc;
  }, {} as Record<string, Material[]>);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6" data-testid="student-materials">
      <div>
        <h1 className="text-2xl font-bold">Study Materials</h1>
        <p className="text-muted-foreground">Download course materials uploaded by your faculty</p>
      </div>

      {materials.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FolderOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No study materials available yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(materialsBySubject).map(([subjectName, subjectMaterials]) => (
            <Card key={subjectName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  {subjectName}
                  <Badge variant="secondary">{subjectMaterials.length} files</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[100px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjectMaterials.map((material) => (
                      <TableRow key={material._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-red-500" />
                            <div>
                              <div className="font-medium">{material.title}</div>
                              <div className="text-xs text-muted-foreground">{material.filename}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {material.uploader?.name || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(material.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <a
                            href={`${apiUrl}${material.filepath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="outline">
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </Button>
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
