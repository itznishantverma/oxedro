'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TimetableSlot {
  id: string;
  teacher_id: string;
  subject_id: string;
  section_ids: string[];
  day_of_week: string;
  period_number: number;
  session_length: number;
  room_id: string | null;
  teacher?: { full_name: string };
  subject?: { subject_name: string };
  room?: { name: string };
}

interface PeriodTemplate {
  days_of_week: string[];
  periods_per_day: number;
  period_timings: { period_number: number; start_time: string; end_time: string; is_break: boolean }[];
}

interface Class {
  id: string;
  class_name: string;
}

interface Teacher {
  id: string;
  full_name: string;
}

interface Room {
  id: string;
  name: string;
}

export default function ViewTimetablePage() {
  const params = useParams();
  const timetableId = params.id as string;

  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [template, setTemplate] = useState<PeriodTemplate | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<'section' | 'teacher' | 'room'>('section');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');

  useEffect(() => {
    Promise.all([
      fetchTimetable(),
      fetchClasses(),
      fetchTeachers(),
      fetchRooms(),
    ]).finally(() => setLoading(false));
  }, [timetableId]);

  useEffect(() => {
    if (viewMode === 'section' && classes.length > 0 && !selectedEntityId) {
      setSelectedEntityId(classes[0].id);
    } else if (viewMode === 'teacher' && teachers.length > 0 && !selectedEntityId) {
      setSelectedEntityId(teachers[0].id);
    } else if (viewMode === 'room' && rooms.length > 0 && !selectedEntityId) {
      setSelectedEntityId(rooms[0].id);
    }
  }, [viewMode, classes, teachers, rooms]);

  const fetchTimetable = async () => {
    try {
      const { data: timetableData, error: timetableError } = await supabase
        .from('generated_timetables')
        .select('*, period_templates(*)')
        .eq('id', timetableId)
        .single();

      if (timetableError) throw timetableError;

      setTemplate(timetableData.period_templates);

      const { data: slotsData, error: slotsError } = await supabase
        .from('timetable_slots')
        .select(`
          *,
          teacher:users!timetable_slots_teacher_id_fkey(full_name),
          subject:subjects!timetable_slots_subject_id_fkey(subject_name),
          room:rooms!timetable_slots_room_id_fkey(name)
        `)
        .eq('timetable_id', timetableId);

      if (slotsError) throw slotsError;
      setSlots(slotsData || []);
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

  const getSlotForCell = (day: string, period: number): TimetableSlot | null => {
    if (viewMode === 'section') {
      return slots.find(s =>
        s.day_of_week === day &&
        s.period_number <= period &&
        s.period_number + s.session_length - 1 >= period &&
        s.section_ids.includes(selectedEntityId)
      ) || null;
    } else if (viewMode === 'teacher') {
      return slots.find(s =>
        s.day_of_week === day &&
        s.period_number <= period &&
        s.period_number + s.session_length - 1 >= period &&
        s.teacher_id === selectedEntityId
      ) || null;
    } else if (viewMode === 'room') {
      return slots.find(s =>
        s.day_of_week === day &&
        s.period_number <= period &&
        s.period_number + s.session_length - 1 >= period &&
        s.room_id === selectedEntityId
      ) || null;
    }
    return null;
  };

  const isSlotStart = (day: string, period: number, slot: TimetableSlot): boolean => {
    return slot.period_number === period;
  };

  const handleExport = () => {
    if (!template) return;

    let csv = 'Period,';
    csv += template.days_of_week.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(',');
    csv += '\n';

    for (let period = 1; period <= template.periods_per_day; period++) {
      csv += `P${period},`;

      const row = template.days_of_week.map(day => {
        const slot = getSlotForCell(day, period);
        if (!slot) return '';

        if (!isSlotStart(day, period, slot)) return '↓';

        const subject = slot.subject?.subject_name || 'Unknown';
        const teacher = slot.teacher?.full_name || 'Unknown';
        const room = slot.room?.name || 'TBA';

        if (viewMode === 'section') {
          return `${subject} - ${teacher} (${room})`;
        } else if (viewMode === 'teacher') {
          const className = classes.filter(c => slot.section_ids.includes(c.id))
            .map(c => c.class_name)
            .join('+');
          return `${subject} - ${className} (${room})`;
        } else {
          const className = classes.filter(c => slot.section_ids.includes(c.id))
            .map(c => c.class_name)
            .join('+');
          return `${subject} - ${teacher} (${className})`;
        }
      });

      csv += row.join(',') + '\n';
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const entityName = viewMode === 'section'
      ? classes.find(c => c.id === selectedEntityId)?.class_name
      : viewMode === 'teacher'
      ? teachers.find(t => t.id === selectedEntityId)?.full_name
      : rooms.find(r => r.id === selectedEntityId)?.name;

    a.download = `timetable_${viewMode}_${entityName}_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Calendar className="h-16 w-16 opacity-20 mb-4" />
        <p className="text-gray-600">Timetable not found</p>
      </div>
    );
  }

  const entities = viewMode === 'section' ? classes : viewMode === 'teacher' ? teachers : rooms;
  const getEntityName = (id: string) => {
    if (viewMode === 'section') return classes.find(c => c.id === id)?.class_name;
    if (viewMode === 'teacher') return teachers.find(t => t.id === id)?.full_name;
    return rooms.find(r => r.id === id)?.name;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">View Timetable</h1>
        <p className="text-gray-600 mt-1">View generated timetables by section, teacher, or room</p>
      </div>

      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <Select value={viewMode} onValueChange={(value: any) => {
              setViewMode(value);
              setSelectedEntityId('');
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="section">Section View</SelectItem>
                <SelectItem value="teacher">Teacher View</SelectItem>
                <SelectItem value="room">Room View</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${viewMode}`} />
              </SelectTrigger>
              <SelectContent>
                {entities.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id}>
                    {viewMode === 'section'
                      ? (entity as Class).class_name
                      : viewMode === 'teacher'
                      ? (entity as Teacher).full_name
                      : (entity as Room).name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Button variant="outline" onClick={handleExport} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {selectedEntityId && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-3 bg-gray-50 font-semibold w-24">Period</th>
                  {template.days_of_week.map((day) => (
                    <th key={day} className="border p-3 bg-gray-50 font-semibold capitalize">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: template.periods_per_day }, (_, i) => i + 1).map((period) => {
                  const timing = template.period_timings.find(t => t.period_number === period);

                  return (
                    <tr key={period}>
                      <td className="border p-2 text-center bg-gray-50">
                        <div className="font-medium">P{period}</div>
                        {timing && (
                          <div className="text-xs text-gray-600">
                            {timing.start_time} - {timing.end_time}
                          </div>
                        )}
                      </td>
                      {template.days_of_week.map((day) => {
                        const slot = getSlotForCell(day, period);

                        if (!slot) {
                          return (
                            <td key={`${day}-${period}`} className="border p-4 bg-gray-50">
                              <div className="text-center text-gray-400 text-sm">Free</div>
                            </td>
                          );
                        }

                        if (!isSlotStart(day, period, slot)) {
                          return (
                            <td key={`${day}-${period}`} className="border p-0 bg-blue-50">
                              <div className="h-full flex items-center justify-center text-blue-600">
                                ↓
                              </div>
                            </td>
                          );
                        }

                        const className = classes.filter(c => slot.section_ids.includes(c.id))
                          .map(c => c.class_name)
                          .join(' + ');

                        return (
                          <td
                            key={`${day}-${period}`}
                            className="border p-3 bg-blue-50"
                            rowSpan={slot.session_length}
                          >
                            <div className="space-y-1">
                              <div className="font-semibold text-blue-900">
                                {slot.subject?.subject_name || 'Unknown Subject'}
                              </div>
                              {viewMode === 'section' && (
                                <div className="text-sm text-gray-700">
                                  {slot.teacher?.full_name || 'Unknown Teacher'}
                                </div>
                              )}
                              {viewMode === 'teacher' && (
                                <div className="text-sm text-gray-700">
                                  {className || 'Unknown Class'}
                                </div>
                              )}
                              {viewMode === 'room' && (
                                <>
                                  <div className="text-sm text-gray-700">
                                    {slot.teacher?.full_name || 'Unknown Teacher'}
                                  </div>
                                  <div className="text-sm text-gray-700">
                                    {className || 'Unknown Class'}
                                  </div>
                                </>
                              )}
                              <div className="flex gap-1 flex-wrap">
                                <Badge variant="secondary" className="text-xs">
                                  {slot.room?.name || 'Room TBA'}
                                </Badge>
                                {slot.session_length > 1 && (
                                  <Badge variant="outline" className="text-xs">
                                    {slot.session_length}P
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
