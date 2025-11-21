'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';

interface ClassInfo {
  id: string;
  class_name: string;
  student_count: number;
  is_active: boolean;
}

export function ClassDistribution() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    loadClassData();
  }, []);

  const loadClassData = async () => {
    try {
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, class_name, is_active, student_classes(id)')
        .eq('is_active', true)
        .order('class_name');

      if (classesData) {
        const formattedClasses: ClassInfo[] = classesData.map(cls => ({
          id: cls.id,
          class_name: cls.class_name,
          student_count: cls.student_classes?.length || 0,
          is_active: cls.is_active,
        }));

        const total = formattedClasses.reduce((sum, cls) => sum + cls.student_count, 0);

        setClasses(formattedClasses.slice(0, 8));
        setTotalStudents(total);
      }
    } catch (error) {
      console.error('Error loading class data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Class Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="h-10 bg-slate-200 rounded w-3/4"></div>
                <div className="h-6 bg-slate-200 rounded w-12"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxStudents = Math.max(...classes.map(c => c.student_count), 1);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">Class Distribution</CardTitle>
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <Users className="w-4 h-4" />
            <span className="font-semibold">{totalStudents} Students</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">No active classes found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {classes.map((cls, index) => {
              const percentage = maxStudents > 0 ? (cls.student_count / maxStudents) * 100 : 0;

              return (
                <div
                  key={cls.id}
                  className="group cursor-pointer"
                  style={{
                    animation: `fadeInLeft 0.5s ease-out ${index * 0.1}s both`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {cls.class_name}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-slate-100">
                      {cls.student_count} {cls.student_count === 1 ? 'student' : 'students'}
                    </Badge>
                  </div>
                  <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${percentage}%`,
                        animation: `slideRight 1s ease-out ${index * 0.1}s both`,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {classes.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Average per class:</span>
              <span className="font-semibold text-slate-900">
                {Math.round(totalStudents / classes.length)} students
              </span>
            </div>
          </div>
        )}

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
