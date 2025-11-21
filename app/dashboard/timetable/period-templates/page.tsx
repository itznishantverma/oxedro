'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Clock, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PeriodTiming {
  period_number: number;
  start_time: string;
  end_time: string;
  is_break: boolean;
}

interface PeriodTemplate {
  id: string;
  name: string;
  academic_year: string;
  days_of_week: string[];
  periods_per_day: number;
  period_timings: PeriodTiming[];
  is_active: boolean;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function PeriodTemplatesPage() {
  const [templates, setTemplates] = useState<PeriodTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PeriodTemplate | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    academic_year: new Date().getFullYear().toString(),
    days_of_week: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    periods_per_day: 8,
    period_timings: [] as PeriodTiming[],
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (formData.periods_per_day > 0 && formData.period_timings.length === 0) {
      generateDefaultTimings(formData.periods_per_day);
    }
  }, [formData.periods_per_day]);

  const generateDefaultTimings = (count: number) => {
    const timings: PeriodTiming[] = [];
    let currentHour = 8;
    let currentMinute = 0;

    for (let i = 1; i <= count; i++) {
      const startTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

      if (i === 4) {
        timings.push({
          period_number: i,
          start_time: startTime,
          end_time: `${String(currentHour).padStart(2, '0')}:${String(currentMinute + 30).padStart(2, '0')}`,
          is_break: true,
        });
        currentMinute += 30;
      } else {
        timings.push({
          period_number: i,
          start_time: startTime,
          end_time: `${String(currentHour).padStart(2, '0')}:${String(currentMinute + 45).padStart(2, '0')}`,
          is_break: false,
        });
        currentMinute += 45;
      }

      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }

    setFormData((prev) => ({ ...prev, period_timings: timings }));
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('period_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from('period_templates')
          .update(formData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast({ title: 'Template updated successfully' });
      } else {
        const { error } = await supabase.from('period_templates').insert([formData]);

        if (error) throw error;
        toast({ title: 'Template created successfully' });
      }

      setDialogOpen(false);
      resetForm();
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (template: PeriodTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      academic_year: template.academic_year,
      days_of_week: template.days_of_week,
      periods_per_day: template.periods_per_day,
      period_timings: template.period_timings,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase.from('period_templates').delete().eq('id', id);

      if (error) throw error;
      toast({ title: 'Template deleted successfully' });
      fetchTemplates();
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
      await supabase.from('period_templates').update({ is_active: false }).neq('id', id);

      const { error } = await supabase
        .from('period_templates')
        .update({ is_active: true })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Active template updated' });
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      academic_year: new Date().getFullYear().toString(),
      days_of_week: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      periods_per_day: 8,
      period_timings: [],
    });
    setEditingTemplate(null);
  };

  const toggleDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter((d) => d !== day)
        : [...prev.days_of_week, day],
    }));
  };

  const updatePeriodTiming = (index: number, field: keyof PeriodTiming, value: any) => {
    const newTimings = [...formData.period_timings];
    newTimings[index] = { ...newTimings[index], [field]: value };
    setFormData((prev) => ({ ...prev, period_timings: newTimings }));
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Period Templates</h1>
          <p className="text-gray-600 mt-1">Configure time slots and schedules for timetables</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Edit Template' : 'Add New Template'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Standard 2024"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="academic_year">Academic Year</Label>
                  <Input
                    id="academic_year"
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    placeholder="2024"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Days of Week</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DAYS.map((day) => (
                    <Badge
                      key={day}
                      variant={formData.days_of_week.includes(day) ? 'default' : 'outline'}
                      className="cursor-pointer capitalize"
                      onClick={() => toggleDay(day)}
                    >
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="periods_per_day">Number of Periods per Day</Label>
                <Input
                  id="periods_per_day"
                  type="number"
                  value={formData.periods_per_day}
                  onChange={(e) => {
                    const count = parseInt(e.target.value);
                    setFormData({ ...formData, periods_per_day: count });
                    generateDefaultTimings(count);
                  }}
                  min="1"
                  max="15"
                  required
                />
              </div>

              <div>
                <Label>Period Timings</Label>
                <div className="space-y-3 mt-2 max-h-96 overflow-y-auto pr-2">
                  {formData.period_timings.map((timing, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="font-medium w-16">P{timing.period_number}</div>
                      <Input
                        type="time"
                        value={timing.start_time}
                        onChange={(e) => updatePeriodTiming(index, 'start_time', e.target.value)}
                        className="w-32"
                      />
                      <span>to</span>
                      <Input
                        type="time"
                        value={timing.end_time}
                        onChange={(e) => updatePeriodTiming(index, 'end_time', e.target.value)}
                        className="w-32"
                      />
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={timing.is_break}
                          onChange={(e) => updatePeriodTiming(index, 'is_break', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm">Break</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingTemplate ? 'Update' : 'Create'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template Name</TableHead>
              <TableHead>Academic Year</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Periods/Day</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  <Clock className="mx-auto h-12 w-12 mb-2 opacity-20" />
                  No templates found. Create your first template to get started.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>{template.academic_year}</TableCell>
                  <TableCell>{template.days_of_week.length} days</TableCell>
                  <TableCell>{template.periods_per_day}</TableCell>
                  <TableCell>
                    <Badge variant={template.is_active ? 'default' : 'secondary'}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!template.is_active && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSetActive(template.id)}
                          title="Set as active"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(template.id)}
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
      </div>
    </div>
  );
}
