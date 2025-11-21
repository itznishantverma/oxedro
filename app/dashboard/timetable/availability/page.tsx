'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AvailabilityConstraint {
  id: string;
  constraint_type: 'teacher' | 'room';
  entity_id: string;
  day_of_week: string;
  period_number: number;
  is_available: boolean;
  reason?: string;
  academic_year: string;
}

interface Teacher {
  id: string;
  full_name: string;
}

interface Room {
  id: string;
  name: string;
}

interface PeriodTemplate {
  id: string;
  name: string;
  periods_per_day: number;
  days_of_week: string[];
  is_active: boolean;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function AvailabilityPage() {
  const [constraints, setConstraints] = useState<AvailabilityConstraint[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [periodTemplate, setPeriodTemplate] = useState<PeriodTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<'teacher' | 'room'>('teacher');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [academicYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    Promise.all([
      fetchConstraints(),
      fetchTeachers(),
      fetchRooms(),
      fetchPeriodTemplate(),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchConstraints();
  }, [viewMode, selectedEntityId]);

  const fetchConstraints = async () => {
    try {
      const { data, error } = await supabase
        .from('availability_constraints')
        .select('*')
        .eq('academic_year', academicYear);

      if (error) throw error;
      setConstraints(data || []);
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
      if (teacherData.length > 0) setSelectedEntityId(teacherData[0].id);
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

  const fetchPeriodTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('period_templates')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      setPeriodTemplate(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const isSlotBlocked = (day: string, period: number): boolean => {
    return constraints.some(
      (c) =>
        c.constraint_type === viewMode &&
        c.entity_id === selectedEntityId &&
        c.day_of_week === day &&
        c.period_number === period &&
        !c.is_available
    );
  };

  const toggleSlot = async (day: string, period: number) => {
    const isBlocked = isSlotBlocked(day, period);

    try {
      if (isBlocked) {
        const constraint = constraints.find(
          (c) =>
            c.constraint_type === viewMode &&
            c.entity_id === selectedEntityId &&
            c.day_of_week === day &&
            c.period_number === period
        );

        if (constraint) {
          const { error } = await supabase
            .from('availability_constraints')
            .delete()
            .eq('id', constraint.id);

          if (error) throw error;
          toast({ title: 'Slot unblocked' });
        }
      } else {
        const { error } = await supabase.from('availability_constraints').insert([
          {
            constraint_type: viewMode,
            entity_id: selectedEntityId,
            day_of_week: day,
            period_number: period,
            is_available: false,
            academic_year: academicYear,
          },
        ]);

        if (error) throw error;
        toast({ title: 'Slot blocked' });
      }

      fetchConstraints();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const clearAllConstraints = async () => {
    if (!confirm('Are you sure you want to clear all blocked slots for this entity?')) return;

    try {
      const { error } = await supabase
        .from('availability_constraints')
        .delete()
        .eq('constraint_type', viewMode)
        .eq('entity_id', selectedEntityId)
        .eq('academic_year', academicYear);

      if (error) throw error;
      toast({ title: 'All slots cleared' });
      fetchConstraints();
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

  if (!periodTemplate) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Calendar className="h-16 w-16 opacity-20" />
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Active Period Template</h2>
          <p className="text-gray-600">Please create and activate a period template first.</p>
        </div>
      </div>
    );
  }

  const entities = viewMode === 'teacher' ? teachers : rooms;
  const getEntityName = (id: string) => {
    if (viewMode === 'teacher') {
      return teachers.find((t) => t.id === id)?.full_name || 'Unknown';
    } else {
      return rooms.find((r) => r.id === id)?.name || 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Availability Constraints</h1>
        <p className="text-gray-600 mt-1">Block time slots when teachers or rooms are unavailable</p>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>View Mode</Label>
            <Select value={viewMode} onValueChange={(value: any) => {
              setViewMode(value);
              setSelectedEntityId(value === 'teacher' ? teachers[0]?.id : rooms[0]?.id);
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teacher">Teacher Availability</SelectItem>
                <SelectItem value="room">Room Availability</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Select {viewMode === 'teacher' ? 'Teacher' : 'Room'}</Label>
            <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {entities.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id}>
                    {viewMode === 'teacher' ? (entity as Teacher).full_name : (entity as Room).name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button variant="outline" onClick={clearAllConstraints} className="w-full">
              <X className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          </div>
        </div>

        {selectedEntityId && (
          <div className="mt-6">
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Viewing:</strong> {getEntityName(selectedEntityId)}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Click on time slots to block/unblock them. Red slots are blocked and will not be used during timetable generation.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 bg-gray-50 font-semibold">Period</th>
                    {periodTemplate.days_of_week.map((day) => (
                      <th key={day} className="border p-2 bg-gray-50 font-semibold capitalize">
                        {day.substring(0, 3)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: periodTemplate.periods_per_day }, (_, i) => i + 1).map((period) => (
                    <tr key={period}>
                      <td className="border p-2 text-center font-medium bg-gray-50">
                        P{period}
                      </td>
                      {periodTemplate.days_of_week.map((day) => {
                        const blocked = isSlotBlocked(day, period);
                        return (
                          <td
                            key={`${day}-${period}`}
                            className={`border p-4 cursor-pointer transition-colors ${
                              blocked
                                ? 'bg-red-100 hover:bg-red-200'
                                : 'bg-green-50 hover:bg-green-100'
                            }`}
                            onClick={() => toggleSlot(day, period)}
                          >
                            <div className="flex items-center justify-center">
                              {blocked ? (
                                <X className="h-5 w-5 text-red-600" />
                              ) : (
                                <div className="h-5 w-5"></div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-50 border rounded"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-100 border rounded"></div>
                <span>Blocked</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
