'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UnassignedSession {
  id: string;
  teaching_assignment_id: string;
  conflict_reasons: string[];
  suggested_fixes: string[];
  assignment?: {
    teacher_id: string;
    subject_id: string;
    section_ids: string[];
    sessions_per_week: number;
    session_length: number;
    teacher?: { full_name: string };
    subject?: { subject_name: string };
  };
}

interface Class {
  id: string;
  class_name: string;
}

export default function ConflictsPage() {
  const params = useParams();
  const router = useRouter();
  const timetableId = params.id as string;

  const [unassignedSessions, setUnassignedSessions] = useState<UnassignedSession[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([fetchUnassignedSessions(), fetchClasses()]).finally(() => setLoading(false));
  }, [timetableId]);

  const fetchUnassignedSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('unassigned_sessions')
        .select(`
          *,
          assignment:teaching_assignments!unassigned_sessions_teaching_assignment_id_fkey(
            *,
            teacher:users!teaching_assignments_teacher_id_fkey(full_name),
            subject:subjects!teaching_assignments_subject_id_fkey(subject_name)
          )
        `)
        .eq('timetable_id', timetableId);

      if (error) throw error;
      setUnassignedSessions(data || []);
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Unassigned Sessions</h1>
          <p className="text-gray-600 mt-1">Review conflicts and suggested resolutions</p>
        </div>
      </div>

      {unassignedSessions.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-green-500 opacity-20" />
          <h2 className="text-xl font-semibold mb-2">No Conflicts Found</h2>
          <p className="text-gray-600">All sessions were successfully assigned!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900">
                  {unassignedSessions.length} Session{unassignedSessions.length > 1 ? 's' : ''} Could Not Be Assigned
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  Review the conflicts below and consider adjusting constraints, adding rooms, or modifying teacher availability.
                </p>
              </div>
            </div>
          </div>

          {unassignedSessions.map((session, index) => (
            <div key={session.id} className="bg-white rounded-lg border p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="destructive">Conflict #{index + 1}</Badge>
                    {session.assignment?.session_length && session.assignment.session_length > 1 && (
                      <Badge variant="secondary">
                        {session.assignment.session_length} Period Session
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold">
                    {session.assignment?.subject?.subject_name || 'Unknown Subject'}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Teacher</div>
                  <div className="font-medium">{session.assignment?.teacher?.full_name || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Sections</div>
                  <div className="font-medium">
                    {session.assignment?.section_ids
                      ? getClassName(session.assignment.section_ids)
                      : 'Unknown'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Sessions Per Week</div>
                  <div className="font-medium">{session.assignment?.sessions_per_week || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Session Length</div>
                  <div className="font-medium">{session.assignment?.session_length || 1} period(s)</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  Conflict Reasons
                </h4>
                <ul className="space-y-2">
                  {session.conflict_reasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-red-600 mt-1">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t mt-4 pt-4">
                <h4 className="font-semibold mb-2 text-blue-900">Suggested Solutions</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Check if the teacher has availability constraints that can be relaxed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Add more rooms or remove room constraints if room-fixed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Reduce the number of sessions per week or break longer sessions into smaller ones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>If combining sections, consider scheduling them separately</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Review the period template and consider adding more periods per day</span>
                  </li>
                </ul>
              </div>
            </div>
          ))}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Next Steps</h4>
            <ol className="space-y-2 text-sm text-blue-800">
              <li>1. Review and adjust the constraints in Teaching Assignments</li>
              <li>2. Check Teacher/Room Availability settings</li>
              <li>3. Consider adding more rooms or increasing capacity</li>
              <li>4. Regenerate the timetable after making changes</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
