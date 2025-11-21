'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface PerformanceOverviewProps {
  stats: {
    attendanceRate: number;
    assignmentCompletion: number;
    averageGrade: number;
  };
  loading: boolean;
}

export function PerformanceOverview({ stats, loading }: PerformanceOverviewProps) {
  const metrics = [
    {
      label: 'Overall Attendance',
      value: stats.attendanceRate || 0,
      color: 'bg-green-500',
    },
    {
      label: 'Assignment Completion',
      value: stats.assignmentCompletion || 0,
      color: 'bg-blue-500',
    },
    {
      label: 'Average Grade',
      value: stats.averageGrade || 0,
      displayValue: stats.averageGrade ? `${stats.averageGrade}%` : 'N/A',
      color: 'bg-purple-500',
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Performance Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-2 bg-slate-200 rounded"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Performance Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className="space-y-2"
            style={{
              animation: `fadeIn 0.5s ease-out ${index * 0.15}s both`,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                {metric.label}
              </span>
              <span className="text-sm font-bold text-slate-900">
                {metric.displayValue || `${metric.value.toFixed(1)}%`}
              </span>
            </div>
            <div className="relative">
              <Progress value={metric.value} className="h-2" />
              <div
                className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-1000 ease-out ${metric.color}`}
                style={{
                  width: `${metric.value}%`,
                  animation: `slideRight 1s ease-out ${index * 0.15}s both`,
                }}
              ></div>
            </div>
          </div>
        ))}
        <style jsx global>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes slideRight {
            from {
              width: 0;
            }
          }
        `}</style>
      </CardContent>
    </Card>
  );
}
