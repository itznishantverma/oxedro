'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Users, UserCheck, Calendar, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';

interface StatsCardsProps {
  stats: {
    totalStudents: number;
    totalTeachers: number;
    activeClasses: number;
    attendanceRate: number;
    studentTrend: number;
    teacherTrend: number;
    classTrend: number;
    attendanceTrend: number;
  };
  loading: boolean;
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  const [animatedStats, setAnimatedStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    activeClasses: 0,
    attendanceRate: 0,
  });

  useEffect(() => {
    if (!loading) {
      const duration = 1000;
      const steps = 60;
      const interval = duration / steps;

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;

        setAnimatedStats({
          totalStudents: Math.round(stats.totalStudents * progress),
          totalTeachers: Math.round(stats.totalTeachers * progress),
          activeClasses: Math.round(stats.activeClasses * progress),
          attendanceRate: Math.round(stats.attendanceRate * progress * 10) / 10,
        });

        if (currentStep >= steps) {
          clearInterval(timer);
          setAnimatedStats({
            totalStudents: stats.totalStudents,
            totalTeachers: stats.totalTeachers,
            activeClasses: stats.activeClasses,
            attendanceRate: stats.attendanceRate,
          });
        }
      }, interval);

      return () => clearInterval(timer);
    }
  }, [loading, stats]);

  const statCards = [
    {
      title: 'Total Students',
      value: animatedStats.totalStudents,
      icon: Users,
      trend: stats.studentTrend,
      bgColor: 'bg-blue-500',
      lightBg: 'bg-blue-50',
    },
    {
      title: 'Total Teachers',
      value: animatedStats.totalTeachers,
      icon: UserCheck,
      trend: stats.teacherTrend,
      bgColor: 'bg-green-500',
      lightBg: 'bg-green-50',
    },
    {
      title: 'Active Classes',
      value: animatedStats.activeClasses,
      icon: Calendar,
      trend: stats.classTrend,
      bgColor: 'bg-yellow-500',
      lightBg: 'bg-yellow-50',
    },
    {
      title: 'Attendance Rate',
      value: `${animatedStats.attendanceRate}%`,
      icon: CheckCircle,
      trend: stats.attendanceTrend,
      bgColor: 'bg-purple-500',
      lightBg: 'bg-purple-50',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        const isPositive = stat.trend >= 0;

        return (
          <Card
            key={stat.title}
            className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
            style={{
              animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 mb-2">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mb-3">
                    {stat.value}
                  </p>
                  <div className="flex items-center space-x-1">
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {Math.abs(stat.trend)}%
                    </span>
                    <span className="text-sm text-slate-500">vs last month</span>
                  </div>
                </div>
                <div className={`${stat.bgColor} rounded-xl p-3 shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
