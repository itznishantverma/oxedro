'use client';

import { useEffect, useState } from 'react';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Subject = Database['public']['Tables']['subjects']['Row'];

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    subject_name: '',
    subject_code: '',
    description: '',
  });
  const { can } = useAuth();
  const { toast } = useToast();

  const canCreate = can('subjects', 'create');
  const canEdit = can('subjects', 'edit');

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('subject_name');

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load subjects',
        variant: 'destructive',
      });
    } else {
      setSubjects(data || []);
    }
    setLoading(false);
  };

  const handleOpenDialog = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        subject_name: subject.subject_name,
        subject_code: subject.subject_code,
        description: subject.description || '',
      });
    } else {
      setEditingSubject(null);
      setFormData({
        subject_name: '',
        subject_code: '',
        description: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingSubject) {
      const { error } = await supabase
        .from('subjects')
        .update({
          subject_name: formData.subject_name,
          description: formData.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingSubject.id);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Subject updated successfully',
        });
        setDialogOpen(false);
        loadSubjects();
      }
    } else {
      const { error } = await supabase.from('subjects').insert({
        subject_name: formData.subject_name,
        subject_code: formData.subject_code.toUpperCase(),
        description: formData.description,
        is_active: true,
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Subject created successfully',
        });
        setDialogOpen(false);
        loadSubjects();
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Subjects Management</h1>
          <p className="text-slate-500 mt-1">Manage subjects and courses</p>
        </div>
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSubject ? 'Edit Subject' : 'Create New Subject'}
                </DialogTitle>
                <DialogDescription>
                  {editingSubject
                    ? 'Update subject information'
                    : 'Add a new subject to the system'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject_name">Subject Name</Label>
                  <Input
                    id="subject_name"
                    value={formData.subject_name}
                    onChange={(e) =>
                      setFormData({ ...formData, subject_name: e.target.value })
                    }
                    placeholder="e.g., Mathematics"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject_code">Subject Code</Label>
                  <Input
                    id="subject_code"
                    value={formData.subject_code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subject_code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="e.g., MATH"
                    required
                    disabled={!!editingSubject}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Subject description"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingSubject ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Subjects</CardTitle>
          <CardDescription>
            {subjects.length} subject{subjects.length !== 1 ? 's' : ''} in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading subjects...</div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No subjects found. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span>{subject.subject_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{subject.subject_code}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {subject.description || '-'}
                    </TableCell>
                    <TableCell>
                      {subject.is_active ? (
                        <Badge className="bg-green-600">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(subject)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
