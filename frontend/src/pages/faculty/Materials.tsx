import { useState, useEffect } from 'react';
import { facultyApi } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Spinner } from '../../components/ui/spinner';
import type { Subject, Material } from '../../types';
import { FolderOpen, Upload, Trash2, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function MaterialsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', file: null as File | null });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await facultyApi.getSubjects();
        setSubjects(response.data.data);
      } catch (err) {
        console.error('Failed to fetch subjects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (!selectedSubject) return;

    const fetchMaterials = async () => {
      try {
        const response = await facultyApi.getMaterials(selectedSubject);
        setMaterials(response.data.data);
      } catch (err) {
        console.error('Failed to fetch materials:', err);
      }
    };
    fetchMaterials();
  }, [selectedSubject]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !selectedSubject) return;

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('title', uploadForm.title);
      formData.append('subjectId', selectedSubject);
      formData.append('file', uploadForm.file);

      await facultyApi.uploadMaterial(formData);
      
      setUploadForm({ title: '', file: null });
      setShowUpload(false);
      setMessage({ type: 'success', text: 'Material uploaded successfully!' });

      // Refresh materials
      const response = await facultyApi.getMaterials(selectedSubject);
      setMaterials(response.data.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to upload material' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    try {
      await facultyApi.deleteMaterial(materialId);
      setMaterials((prev) => prev.filter((m) => m._id !== materialId));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to delete material');
    }
  };

  const apiUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6" data-testid="materials-page">
      <div>
        <h1 className="text-2xl font-bold">Study Materials</h1>
        <p className="text-muted-foreground">Upload and manage study materials for your subjects</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Select Subject
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select
              className="w-full md:w-96"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              options={subjects.map((s) => ({
                value: s._id,
                label: `${s.name} (${s.code})`,
              }))}
              placeholder="Select Subject"
            />
            {selectedSubject && (
              <Button onClick={() => setShowUpload(!showUpload)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Material
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {showUpload && selectedSubject && (
        <Card>
          <CardHeader>
            <CardTitle>Upload New Material</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    placeholder="Lecture Notes - Week 1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>File (PDF only)</Label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowUpload(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {selectedSubject && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Materials</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Filename</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      No materials uploaded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  materials.map((material) => (
                    <TableRow key={material._id}>
                      <TableCell className="font-medium">{material.title}</TableCell>
                      <TableCell className="text-muted-foreground">{material.filename}</TableCell>
                      <TableCell>{format(new Date(material.createdAt), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <a
                            href={`${apiUrl}${material.filepath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="icon">
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(material._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
