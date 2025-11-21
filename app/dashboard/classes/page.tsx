'use client';
export const dynamic = 'force-dynamic';

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
import { Plus, Pencil, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Class = Database['public']['Tables']['classes']['Row'];

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({
    class_name: '',
    class_code: '',
    description: '',
    academic_year: new Date().getFullYear().toString(),
  });
  const { can } = useAuth();
  const { toast } = useToast();

  const canCreate = can('classes', 'create');
  const canEdit = can('classes', 'edit');

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('class_name');

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load classes',
        variant: 'destructive',
      });
    } else {
      setClasses(data || []);
    }
    setLoading(false);
  };

  const handleOpenDialog = (cls?: Class) => {
    if (cls) {
      setEditingClass(cls);
      setFormData({
        class_name: cls.class_name,
        class_code: cls.class_code,
        description: cls.description || '',
        academic_year: cls.academic_year || new Date().getFullYear().toString(),
      });
    } else {
      setEditingClass(null);
      setFormData({
        class_name: '',
        class_code: '',
        description: '',
        academic_year: new Date().getFullYear().toString(),
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingClass) {
      const { error } = await supabase
        .from('classes')
        .update({
          class_name: formData.class_name,
          description: formData.description,
          academic_year: formData.academic_year,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingClass.id);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Class updated successfully',
        });
        setDialogOpen(false);
        loadClasses();
      }
    } else {
      const { error } = await supabase.from('classes').insert({
        class_name: formData.class_name,
        class_code: formData.class_code.toUpperCase(),
        description: formData.description,
        academic_year: formData.academic_year,
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
          description: 'Class created successfully',
        });
        setDialogOpen(false);
        loadClasses();
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Classes Management</h1>
          <p className="text-slate-500 mt-1">Manage classes and grade levels</p>
        </div>
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingClass ? 'Edit Class' : 'Create New Class'}
                </DialogTitle>
                <DialogDescription>
                  {editingClass
                    ? 'Update class information'
                    : 'Add a new class to the system'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="class_name">Class Name</Label>
                  <Input
                    id="class_name"
                    value={formData.class_name}
                    onChange={(e) =>
                      setFormData({ ...formData, class_name: e.target.value })
                    }
                    placeholder="e.g., Grade 10A"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class_code">Class Code</Label>
                  <Input
                    id="class_code"
                    value={formData.class_code}
                    onChange={(e) =>
                      setFormData({ ...formData, class_code: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g., 10A"
                    required
                    disabled={!!editingClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academic_year">Academic Year</Label>
                  <Input
                    id="academic_year"
                    value={formData.academic_year}
                    onChange={(e) =>
                      setFormData({ ...formData, academic_year: e.target.value })
                    }
                    placeholder="e.g., 2024"
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
                    placeholder="Class description"
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
                    {editingClass ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Classes</CardTitle>
          <CardDescription>
            {classes.length} class{classes.length !== 1 ? 'es' : ''} in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading classes...</div>
          ) : classes.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No classes found. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-slate-500" />
                        <span>{cls.class_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{cls.class_code}</Badge>
                    </TableCell>
                    <TableCell>{cls.academic_year || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {cls.description || '-'}
                    </TableCell>
                    <TableCell>
                      {cls.is_active ? (
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
                          onClick={() => handleOpenDialog(cls)}
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
