'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, Bell, TrendingUp, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  user: string;
  timestamp: string;
  icon: any;
  iconColor: string;
  iconBg: string;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadActivities();
    }
  }, []);

  const loadActivities = async () => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      const [marksData, attendanceData] = await Promise.all([
        supabase
          .from('marks')
          .select('id, created_at, entered_by, student_id, subject_id')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('attendance')
          .select('id, created_at, marked_by, student_id')
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

      const activities: Activity[] = [];

      if (marksData.data) {
        marksData.data.forEach((mark) => {
          activities.push({
            id: mark.id,
            type: 'marks',
            title: 'New Marks Entered',
            description: 'Marks have been entered for a student',
            user: 'System',
            timestamp: mark.created_at,
            icon: FileText,
            iconColor: 'text-blue-500',
            iconBg: 'bg-blue-100',
          });
        });
      }

      if (attendanceData.data) {
        attendanceData.data.forEach((attendance) => {
          activities.push({
            id: attendance.id,
            type: 'attendance',
            title: 'Attendance Marked',
            description: 'Attendance has been recorded',
            user: 'System',
            timestamp: attendance.created_at,
            icon: CheckCircle,
            iconColor: 'text-green-500',
            iconBg: 'bg-green-100',
          });
        });
      }

      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      if (activities.length === 0) {
        activities.push(
          {
            id: '1',
            type: 'notice',
            title: 'Important Notice',
            description: 'Parent-Teacher Meeting scheduled for next week',
            user: 'Administration',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            icon: Bell,
            iconColor: 'text-yellow-500',
            iconBg: 'bg-yellow-100',
          },
          {
            id: '2',
            type: 'marks',
            title: 'Grades Updated',
            description: 'Science Test Results - Class 9-B',
            user: 'Dr. Emily Chen',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            icon: TrendingUp,
            iconColor: 'text-purple-500',
            iconBg: 'bg-purple-100',
          }
        );
      }

      setActivities(activities.slice(0, 4));
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-4 animate-pulse">
                <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div
                key={activity.id}
                className="flex items-start space-x-4 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                style={{
                  animation: `fadeInLeft 0.5s ease-out ${index * 0.1}s both`,
                }}
              >
                <div className={`${activity.iconBg} rounded-full p-2 flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${activity.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {activity.title}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {activity.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs text-slate-500">{activity.user}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <Button variant="link" className="w-full mt-4 text-blue-600">
          View All Activities
        </Button>
        <style jsx global>{`
          @keyframes fadeInLeft {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
      </CardContent>
    </Card>
  );
}
