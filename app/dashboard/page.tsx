'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { PerformanceOverview } from '@/components/dashboard/performance-overview';
import { UpcomingEvents } from '@/components/dashboard/upcoming-events';
import { InteractiveCharts } from '@/components/dashboard/interactive-charts';

function DashboardPageContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    activeClasses: 0,
    attendanceRate: 0,
    studentTrend: 0,
    teacherTrend: 0,
    classTrend: 0,
    attendanceTrend: 0,
  });

  const [performanceData, setPerformanceData] = useState({
    attendanceRate: 0,
    assignmentCompletion: 0,
    averageGrade: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadDashboardData();
    }
  }, []);

  const loadDashboardData = async () => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      const { data: rolesData } = await supabase
        .from('roles')
        .select('id, role_code');

      const studentRole = rolesData?.find(r => r.role_code === 'ST');
      const teacherRole = rolesData?.find(r => r.role_code === 'TE');

      const currentDate = new Date();
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);

      const [studentsRes, teachersRes, classesRes, attendanceRes] = await Promise.all([
        studentRole ? supabase.from('users').select('id, created_at', { count: 'exact' }).eq('role_id', studentRole.id).eq('is_active', true) : { count: 0, data: [] },
        teacherRole ? supabase.from('users').select('id, created_at', { count: 'exact' }).eq('role_id', teacherRole.id).eq('is_active', true) : { count: 0, data: [] },
        supabase.from('classes').select('id, created_at', { count: 'exact' }).eq('is_active', true),
        supabase.from('attendance').select('id, status, attendance_date', { count: 'exact' }),
      ]);

      const totalStudents = studentsRes.count || 0;
      const totalTeachers = teachersRes.count || 0;
      const activeClasses = classesRes.count || 0;

      const studentsLastMonth = studentsRes.data?.filter(
        s => new Date(s.created_at) <= lastMonthDate
      ).length || 0;
      const teachersLastMonth = teachersRes.data?.filter(
        t => new Date(t.created_at) <= lastMonthDate
      ).length || 0;
      const classesLastMonth = classesRes.data?.filter(
        c => new Date(c.created_at) <= lastMonthDate
      ).length || 0;

      const studentTrend = studentsLastMonth > 0
        ? Math.round(((totalStudents - studentsLastMonth) / studentsLastMonth * 100) * 10) / 10
        : totalStudents > 0 ? 100 : 0;

      const teacherTrend = teachersLastMonth > 0
        ? Math.round(((totalTeachers - teachersLastMonth) / teachersLastMonth * 100) * 10) / 10
        : totalTeachers > 0 ? 100 : 0;

      const classTrend = classesLastMonth > 0
        ? Math.round(((activeClasses - classesLastMonth) / classesLastMonth * 100) * 10) / 10
        : activeClasses > 0 ? 100 : 0;

      const presentCount = attendanceRes.data?.filter(a => a.status === 'present').length || 0;
      const totalAttendance = attendanceRes.count || 0;
      const attendanceRate = totalAttendance > 0
        ? Math.round((presentCount / totalAttendance * 100) * 10) / 10
        : 0;

      const lastMonthAttendance = attendanceRes.data?.filter(
        a => new Date(a.attendance_date) <= lastMonthDate
      ) || [];
      const lastMonthPresent = lastMonthAttendance.filter(a => a.status === 'present').length;
      const lastMonthTotal = lastMonthAttendance.length;
      const lastMonthRate = lastMonthTotal > 0 ? (lastMonthPresent / lastMonthTotal * 100) : 0;

      const attendanceTrend = lastMonthRate > 0
        ? Math.round((attendanceRate - lastMonthRate) * 10) / 10
        : 0;

      const { data: marksData } = await supabase
        .from('marks')
        .select('marks_obtained, total_marks');

      let averageGrade = 0;
      if (marksData && marksData.length > 0) {
        const totalPercentage = marksData.reduce((sum, mark) => {
          return sum + ((mark.marks_obtained / mark.total_marks) * 100);
        }, 0);
        averageGrade = Math.round(totalPercentage / marksData.length);
      }

      setStats({
        totalStudents,
        totalTeachers,
        activeClasses,
        attendanceRate,
        studentTrend,
        teacherTrend,
        classTrend,
        attendanceTrend,
      });

      setPerformanceData({
        attendanceRate,
        assignmentCompletion: 87.2,
        averageGrade,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <StatsCards stats={stats} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <InteractiveCharts />
        </div>
        <div className="lg:col-span-3">
          {/* Placeholder for future content */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentActivity />
          <UpcomingEvents />
        </div>

        <div className="space-y-6">
          <QuickActions />
          <PerformanceOverview stats={performanceData} loading={loading} />
        </div>
      </div>
    </div>
  );
}

const DashboardPage = dynamic(() => Promise.resolve(DashboardPageContent), {
  ssr: false,
  loading: () => (
    <div className="p-4 md:p-6 space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="h-32 bg-slate-200 rounded"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    </div>
  ),
});

export default DashboardPage;
