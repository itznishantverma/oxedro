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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Teacher {
  id: string;
  full_name: string;
}

interface Subject {
  id: string;
  subject_name: string;
}

interface Class {
  id: string;
  class_name: string;
}

interface Room {
  id: string;
  name: string;
}

interface TeachingAssignment {
  id: string;
  teacher_id: string;
  subject_id: string;
  section_ids: string[];
  sessions_per_week: number;
  session_length: number;
  preferred_room_ids: string[];
  room_fixed: boolean;
  allowed_days: string[] | null;
  fixed_day: string | null;
  fixed_period: number | null;
  same_daily_pattern: boolean;
  academic_year: string;
  is_active: boolean;
  teacher?: Teacher;
  subject?: Subject;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function TeachingAssignmentsPage() {
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TeachingAssignment | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    teacher_id: '',
    subject_id: '',
    section_ids: [] as string[],
    sessions_per_week: 5,
    session_length: 1,
    preferred_room_ids: [] as string[],
    room_fixed: false,
    allowed_days: null as string[] | null,
    fixed_day: null as string | null,
    fixed_period: null as number | null,
    same_daily_pattern: false,
    academic_year: new Date().getFullYear().toString(),
    is_active: true,
  });

  useEffect(() => {
    Promise.all([
      fetchAssignments(),
      fetchTeachers(),
      fetchSubjects(),
      fetchClasses(),
      fetchRooms(),
    ]).finally(() => setLoading(false));
  }, []);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('teaching_assignments')
        .select(`
          *,
          teacher:users!teaching_assignments_teacher_id_fkey(id, full_name),
          subject:subjects!teaching_assignments_subject_id_fkey(id, subject_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, role_id, roles!users_role_id_fkey(role_code)')
        .eq('is_active', true);

      if (error) throw error;
      const teacherData = data?.filter((u: any) => u.roles?.role_code === 'TE') || [];
      setTeachers(teacherData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, subject_name')
        .eq('is_active', true)
        .order('subject_name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, class_name')
        .eq('is_active', true)
        .order('class_name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setRooms(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.section_ids.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one section',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingAssignment) {
        const { error } = await supabase
          .from('teaching_assignments')
          .update(formData)
          .eq('id', editingAssignment.id);

        if (error) throw error;
        toast({ title: 'Assignment updated successfully' });
      } else {
        const { error } = await supabase.from('teaching_assignments').insert([formData]);

        if (error) throw error;
        toast({ title: 'Assignment created successfully' });
      }

      setDialogOpen(false);
      resetForm();
      fetchAssignments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (assignment: TeachingAssignment) => {
    setEditingAssignment(assignment);
    setFormData({
      teacher_id: assignment.teacher_id,
      subject_id: assignment.subject_id,
      section_ids: assignment.section_ids,
      sessions_per_week: assignment.sessions_per_week,
      session_length: assignment.session_length,
      preferred_room_ids: assignment.preferred_room_ids || [],
      room_fixed: assignment.room_fixed,
      allowed_days: assignment.allowed_days,
      fixed_day: assignment.fixed_day,
      fixed_period: assignment.fixed_period,
      same_daily_pattern: assignment.same_daily_pattern,
      academic_year: assignment.academic_year,
      is_active: assignment.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      const { error } = await supabase.from('teaching_assignments').delete().eq('id', id);

      if (error) throw error;
      toast({ title: 'Assignment deleted successfully' });
      fetchAssignments();
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
      teacher_id: '',
      subject_id: '',
      section_ids: [],
      sessions_per_week: 5,
      session_length: 1,
      preferred_room_ids: [],
      room_fixed: false,
      allowed_days: null,
      fixed_day: null,
      fixed_period: null,
      same_daily_pattern: false,
      academic_year: new Date().getFullYear().toString(),
      is_active: true,
    });
    setEditingAssignment(null);
  };

  const toggleSection = (sectionId: string) => {
    setFormData((prev) => ({
      ...prev,
      section_ids: prev.section_ids.includes(sectionId)
        ? prev.section_ids.filter((id) => id !== sectionId)
        : [...prev.section_ids, sectionId],
    }));
  };

  const toggleRoom = (roomId: string) => {
    setFormData((prev) => ({
      ...prev,
      preferred_room_ids: prev.preferred_room_ids.includes(roomId)
        ? prev.preferred_room_ids.filter((id) => id !== roomId)
        : [...prev.preferred_room_ids, roomId],
    }));
  };

  const toggleAllowedDay = (day: string) => {
    setFormData((prev) => {
      const currentDays = prev.allowed_days || [];
      const newDays = currentDays.includes(day)
        ? currentDays.filter((d) => d !== day)
        : [...currentDays, day];
      return { ...prev, allowed_days: newDays.length > 0 ? newDays : null };
    });
  };

  const getClassName = (sectionIds: string[]) => {
    return sectionIds
      .map((id) => classes.find((c) => c.id === id)?.class_name)
      .filter(Boolean)
      .join(' + ');
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
          <h1 className="text-3xl font-bold">Teaching Assignments</h1>
          <p className="text-gray-600 mt-1">Configure teaching rules and constraints for timetable generation</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAssignment ? 'Edit Assignment' : 'Add New Assignment'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="teacher_id">Teacher</Label>
                  <Select
                    value={formData.teacher_id}
                    onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subject_id">Subject</Label>
                  <Select
                    value={formData.subject_id}
                    onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.subject_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Sections (Classes)</Label>
                <p className="text-xs text-gray-500 mb-2">Select multiple for combined classes</p>
                <div className="flex flex-wrap gap-2">
                  {classes.map((cls) => (
                    <Badge
                      key={cls.id}
                      variant={formData.section_ids.includes(cls.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleSection(cls.id)}
                    >
                      {cls.class_name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessions_per_week">Sessions per Week</Label>
                  <Input
                    id="sessions_per_week"
                    type="number"
                    value={formData.sessions_per_week}
                    onChange={(e) => setFormData({ ...formData, sessions_per_week: parseInt(e.target.value) })}
                    min="1"
                    max="20"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="session_length">Session Length (Periods)</Label>
                  <Input
                    id="session_length"
                    type="number"
                    value={formData.session_length}
                    onChange={(e) => setFormData({ ...formData, session_length: parseInt(e.target.value) })}
                    min="1"
                    max="4"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Preferred Rooms (in order)</Label>
                <p className="text-xs text-gray-500 mb-2">Click to add/remove, order matters</p>
                <div className="flex flex-wrap gap-2">
                  {rooms.map((room) => (
                    <Badge
                      key={room.id}
                      variant={formData.preferred_room_ids.includes(room.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleRoom(room.id)}
                    >
                      {room.name}
                      {formData.preferred_room_ids.includes(room.id) && (
                        <span className="ml-1 text-xs">
                          ({formData.preferred_room_ids.indexOf(room.id) + 1})
                        </span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="room_fixed"
                  checked={formData.room_fixed}
                  onChange={(e) => setFormData({ ...formData, room_fixed: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="room_fixed" className="cursor-pointer">
                  Room Fixed (must use preferred room only)
                </Label>
              </div>

              <div>
                <Label>Allowed Days (optional)</Label>
                <p className="text-xs text-gray-500 mb-2">Leave all unselected for any day</p>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <Badge
                      key={day}
                      variant={(formData.allowed_days || []).includes(day) ? 'default' : 'outline'}
                      className="cursor-pointer capitalize"
                      onClick={() => toggleAllowedDay(day)}
                    >
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fixed_day">Fixed Day (optional)</Label>
                  <Select
                    value={formData.fixed_day || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, fixed_day: value === 'none' ? null : value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No fixed day</SelectItem>
                      {DAYS.map((day) => (
                        <SelectItem key={day} value={day} className="capitalize">
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="fixed_period">Fixed Period (optional)</Label>
                  <Input
                    id="fixed_period"
                    type="number"
                    value={formData.fixed_period || ''}
                    onChange={(e) => setFormData({ ...formData, fixed_period: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Leave empty for any"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="same_daily_pattern"
                  checked={formData.same_daily_pattern}
                  onChange={(e) => setFormData({ ...formData, same_daily_pattern: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="same_daily_pattern" className="cursor-pointer">
                  Same Daily Pattern (all days have same timetable)
                </Label>
              </div>

              <div>
                <Label htmlFor="academic_year">Academic Year</Label>
                <Input
                  id="academic_year"
                  value={formData.academic_year}
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingAssignment ? 'Update' : 'Create'}
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
              <TableHead>Teacher</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Sections</TableHead>
              <TableHead>Sessions/Week</TableHead>
              <TableHead>Length</TableHead>
              <TableHead>Constraints</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  <BookOpen className="mx-auto h-12 w-12 mb-2 opacity-20" />
                  No assignments found. Create your first assignment to get started.
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{assignment.teacher?.full_name}</TableCell>
                  <TableCell>{assignment.subject?.subject_name}</TableCell>
                  <TableCell>{getClassName(assignment.section_ids)}</TableCell>
                  <TableCell>{assignment.sessions_per_week}</TableCell>
                  <TableCell>{assignment.session_length}p</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {assignment.room_fixed && (
                        <Badge variant="secondary" className="text-xs">Fixed Room</Badge>
                      )}
                      {assignment.fixed_day && (
                        <Badge variant="secondary" className="text-xs capitalize">{assignment.fixed_day}</Badge>
                      )}
                      {assignment.same_daily_pattern && (
                        <Badge variant="secondary" className="text-xs">Same Pattern</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(assignment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(assignment.id)}
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
