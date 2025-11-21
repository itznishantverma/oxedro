'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Download, Maximize2, Minimize2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabase';

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4',
  '#ec4899', '#14b8a6', '#f97316', '#a855f7', '#22c55e', '#0ea5e9',
  '#f43f5e', '#84cc16', '#06b6d4', '#6366f1', '#eab308', '#d946ef',
  '#10b981', '#f59e0b', '#8b5cf6', '#14b8a6', '#f97316', '#22c55e'
];

const getColor = (index: number) => {
  if (index < COLORS.length) return COLORS[index];
  const hue = (index * 137.508) % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

export function InteractiveCharts() {
  const [dataSource, setDataSource] = useState('attendance');
  const [chartType, setChartType] = useState('line');
  const [timePeriod, setTimePeriod] = useState('30days');
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    loadChartData();
  }, [dataSource, timePeriod]);

  const loadChartData = async () => {
    setLoading(true);
    try {
      let data: any[] = [];

      if (dataSource === 'attendance') {
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('attendance_date, status')
          .order('attendance_date', { ascending: false })
          .limit(100);

        if (attendanceData && attendanceData.length > 0) {
          const groupedByDate: { [key: string]: { present: number; total: number } } = {};

          attendanceData.forEach(record => {
            const date = new Date(record.attendance_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!groupedByDate[date]) {
              groupedByDate[date] = { present: 0, total: 0 };
            }
            groupedByDate[date].total++;
            if (record.status === 'present') {
              groupedByDate[date].present++;
            }
          });

          data = Object.keys(groupedByDate).reverse().map(date => ({
            name: date,
            value: Math.round((groupedByDate[date].present / groupedByDate[date].total) * 100)
          }));
        }

        if (data.length === 0) {
          data = [{ name: 'No Data', value: 0 }];
        }
      } else if (dataSource === 'marks') {
        const { data: marksData } = await supabase
          .from('marks')
          .select('marks_obtained, total_marks, subject_id, subjects(subject_name)')
          .limit(100);

        if (marksData && marksData.length > 0) {
          const groupedBySubject: { [key: string]: { total: number; count: number } } = {};

          marksData.forEach((mark: any) => {
            const subjectName = mark.subjects?.subject_name || 'Unknown';
            if (!groupedBySubject[subjectName]) {
              groupedBySubject[subjectName] = { total: 0, count: 0 };
            }
            groupedBySubject[subjectName].total += (mark.marks_obtained / mark.total_marks) * 100;
            groupedBySubject[subjectName].count++;
          });

          data = Object.keys(groupedBySubject).map(subject => ({
            name: subject,
            value: Math.round(groupedBySubject[subject].total / groupedBySubject[subject].count)
          }));
        }

        if (data.length === 0) {
          data = [{ name: 'No Data', value: 0 }];
        }
      } else if (dataSource === 'classes') {
        const { data: classesData } = await supabase
          .from('classes')
          .select('id, is_active, class_name, student_classes(id)')
          .eq('is_active', true);

        if (classesData && classesData.length > 0) {
          data = classesData.map(cls => ({
            name: cls.class_name,
            value: cls.student_classes?.length || 0
          }));
        }

        if (data.length === 0) {
          data = [{ name: 'No Data', value: 0 }];
        }
      } else if (dataSource === 'students') {
        const { data: rolesData } = await supabase
          .from('roles')
          .select('id, role_code');

        const studentRole = rolesData?.find(r => r.role_code === 'ST');

        if (studentRole) {
          const { data: studentsData } = await supabase
            .from('users')
            .select('id, student_classes(class_id, classes(class_name))')
            .eq('role_id', studentRole.id)
            .eq('is_active', true);

          if (studentsData && studentsData.length > 0) {
            const groupedByClass: { [key: string]: number } = {};

            studentsData.forEach((student: any) => {
              if (student.student_classes && student.student_classes.length > 0) {
                const className = student.student_classes[0].classes?.class_name || 'Unassigned';
                groupedByClass[className] = (groupedByClass[className] || 0) + 1;
              }
            });

            data = Object.keys(groupedByClass).map(className => ({
              name: className,
              value: groupedByClass[className]
            }));
          }
        }

        if (data.length === 0) {
          data = [{ name: 'No Data', value: 0 }];
        }
      }

      setChartData(data);
    } catch (error) {
      console.error('Error loading chart data:', error);
      setChartData([{ name: 'Error', value: 0 }]);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = (height: number = 200) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    const chartProps = {
      data: chartData,
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              {isMaximized && <Legend />}
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              {isMaximized && <Legend />}
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const showLabels = chartData.length <= 12;
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={showLabels}
                label={showLabels ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` : false}
                outerRadius={isMaximized ? 120 : 70}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(index)} />
                ))}
              </Pie>
              <Tooltip />
              {isMaximized && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart {...chartProps}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              {isMaximized && <Legend />}
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const ChartControls = () => (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={dataSource} onValueChange={setDataSource}>
        <SelectTrigger className="w-[140px] h-9 text-sm">
          <SelectValue placeholder="Select data" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="attendance">Attendance</SelectItem>
          <SelectItem value="marks">Marks</SelectItem>
          <SelectItem value="classes">Classes</SelectItem>
          <SelectItem value="students">Students</SelectItem>
        </SelectContent>
      </Select>

      <Select value={chartType} onValueChange={setChartType}>
        <SelectTrigger className="w-[120px] h-9 text-sm">
          <SelectValue placeholder="Chart type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="line">Line</SelectItem>
          <SelectItem value="bar">Bar</SelectItem>
          <SelectItem value="pie">Pie</SelectItem>
          <SelectItem value="area">Area</SelectItem>
        </SelectContent>
      </Select>

      <Select value={timePeriod} onValueChange={setTimePeriod}>
        <SelectTrigger className="w-[120px] h-9 text-sm">
          <SelectValue placeholder="Period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7days">7 days</SelectItem>
          <SelectItem value="30days">30 days</SelectItem>
          <SelectItem value="3months">3 months</SelectItem>
          <SelectItem value="year">Year</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" size="icon" className="h-9 w-9">
        <Download className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={() => setIsMaximized(true)}
      >
        <Maximize2 className="w-4 h-4" />
      </Button>
    </div>
  );

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-slate-50 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <CardTitle className="text-lg font-bold">Data Visualization</CardTitle>
            <ChartControls />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {renderChart(200)}
        </CardContent>
      </Card>

      <Dialog open={isMaximized} onOpenChange={setIsMaximized}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold">Data Visualization</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMaximized(false)}
              >
                <Minimize2 className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <ChartControls />
            <div className="border rounded-lg p-4">
              {renderChart(500)}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
