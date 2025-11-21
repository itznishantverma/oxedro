'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Play, Eye, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface PeriodTemplate {
  id: string;
  name: string;
  academic_year: string;
  is_active: boolean;
}

interface GeneratedTimetable {
  id: string;
  name: string;
  academic_year: string;
  generation_status: string;
  total_sessions: number;
  assigned_sessions: number;
  unassigned_sessions: number;
  generation_log: string[];
  is_active: boolean;
  created_at: string;
}

export default function GenerateTimetablePage() {
  const [templates, setTemplates] = useState<PeriodTemplate[]>([]);
  const [timetables, setTimetables] = useState<GeneratedTimetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState({
    timetableName: `Timetable ${new Date().toLocaleDateString()}`,
    academicYear: new Date().getFullYear().toString(),
    periodTemplateId: '',
  });

  useEffect(() => {
    Promise.all([fetchTemplates(), fetchTimetables()]).finally(() => setLoading(false));
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('period_templates')
        .select('*')
        .order('is_active', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);

      const activeTemplate = data?.find((t) => t.is_active);
      if (activeTemplate) {
        setFormData((prev) => ({
          ...prev,
          periodTemplateId: activeTemplate.id,
          academicYear: activeTemplate.academic_year,
        }));
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fetchTimetables = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_timetables')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTimetables(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.periodTemplateId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a period template',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-timetable`;
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate timetable');
      }

      toast({
        title: 'Success',
        description: `Timetable generated: ${result.assignedSessions}/${result.totalSessions} sessions assigned`,
      });

      fetchTimetables();

      if (result.unassignedSessions > 0) {
        toast({
          title: 'Warning',
          description: `${result.unassignedSessions} sessions could not be assigned. Check conflicts.`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this timetable?')) return;

    try {
      const { error } = await supabase
        .from('generated_timetables')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Timetable deleted successfully' });
      fetchTimetables();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await supabase
        .from('generated_timetables')
        .update({ is_active: false })
        .neq('id', id);

      const { error } = await supabase
        .from('generated_timetables')
        .update({ is_active: true })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Active timetable updated' });
      fetchTimetables();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Generate Timetable</h1>
        <p className="text-gray-600 mt-1">Create new timetables using configured assignments and constraints</p>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">New Timetable</h2>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="timetableName">Timetable Name</Label>
              <Input
                id="timetableName"
                value={formData.timetableName}
                onChange={(e) => setFormData({ ...formData, timetableName: e.target.value })}
                placeholder="e.g., Spring 2024"
                required
              />
            </div>

            <div>
              <Label htmlFor="academicYear">Academic Year</Label>
              <Input
                id="academicYear"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="periodTemplateId">Period Template</Label>
              <Select
                value={formData.periodTemplateId}
                onValueChange={(value) => setFormData({ ...formData, periodTemplateId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} {template.is_active && '(Active)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" disabled={generating} className="w-full">
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Timetable...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Generate Timetable
              </>
            )}
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Generated Timetables</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Academic Year</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sessions</TableHead>
              <TableHead>Success Rate</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {timetables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  <Calendar className="mx-auto h-12 w-12 mb-2 opacity-20" />
                  No timetables generated yet. Create your first timetable above.
                </TableCell>
              </TableRow>
            ) : (
              timetables.map((timetable) => {
                const successRate = timetable.total_sessions > 0
                  ? Math.round((timetable.assigned_sessions / timetable.total_sessions) * 100)
                  : 0;

                return (
                  <TableRow key={timetable.id}>
                    <TableCell className="font-medium">
                      {timetable.name}
                      {timetable.is_active && (
                        <Badge variant="default" className="ml-2">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>{timetable.academic_year}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          timetable.generation_status === 'completed'
                            ? 'default'
                            : timetable.generation_status === 'generating'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {timetable.generation_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {timetable.assigned_sessions}/{timetable.total_sessions}
                      {timetable.unassigned_sessions > 0 && (
                        <span className="ml-2 text-orange-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {timetable.unassigned_sessions} conflicts
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              successRate === 100 ? 'bg-green-500' :
                              successRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${successRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{successRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(timetable.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/dashboard/timetable/view/${timetable.id}`)}
                          title="View timetable"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {timetable.unassigned_sessions > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/dashboard/timetable/conflicts/${timetable.id}`)}
                            title="View conflicts"
                          >
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(timetable.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
