'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  Check,
  X,
  Clock,
  FileText,
  TrendingUp,
  Download,
  Users,
  BarChart3
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Student {
  id: string;
  full_name: string;
  unique_id: string;
}

interface Class {
  id: string;
  class_name: string;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  attendance_date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks: string;
  student?: { full_name: string; unique_id: string };
}

interface AttendanceStats {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  excused_days: number;
  attendance_rate: number;
}

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState('mark');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentStatus, setStudentStatus] = useState<Record<string, string>>({});
  const [studentRemarks, setStudentRemarks] = useState<Record<string, string>>({});

  const [filterClass, setFilterClass] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudentsForClass(selectedClass);
      loadExistingAttendance();
    }
  }, [selectedClass, selectedDate]);

  useEffect(() => {
    if (activeTab === 'view') {
      loadAttendanceRecords();
    }
  }, [activeTab, filterClass, filterStartDate, filterEndDate]);

  useEffect(() => {
    if (activeTab === 'analytics' && selectedStudent) {
      loadStudentStats();
    }
  }, [activeTab, selectedStudent, filterStartDate, filterEndDate]);

  const loadClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('*')
      .eq('academic_year', '2025')
      .eq('is_active', true);
    if (data) setClasses(data);
  };

  const loadStudentsForClass = async (classId: string) => {
    const { data } = await supabase
      .from('student_classes')
      .select(`student_id, users!inner(id, full_name, unique_id)`)
      .eq('class_id', classId)
      .eq('academic_year', '2025');

    const studentsData = data?.map((sc: any) => ({
      id: sc.users.id,
      full_name: sc.users.full_name,
      unique_id: sc.users.unique_id,
    })) || [];

    setStudents(studentsData);
  };

  const loadExistingAttendance = async () => {
    if (!selectedClass || !selectedDate) return;

    const { data } = await supabase
      .from('attendance')
      .select('student_id, status, remarks')
      .eq('class_id', selectedClass)
      .eq('attendance_date', selectedDate);

    if (data) {
      const statusMap: Record<string, string> = {};
      const remarksMap: Record<string, string> = {};
      data.forEach(att => {
        statusMap[att.student_id] = att.status;
        remarksMap[att.student_id] = att.remarks || '';
      });
      setStudentStatus(statusMap);
      setStudentRemarks(remarksMap);
    }
  };

  const loadAttendanceRecords = async () => {
    setLoading(true);
    let query = supabase
      .from('attendance')
      .select(`*, student:users!attendance_student_id_fkey(full_name, unique_id)`)
      .eq('academic_year', '2025')
      .order('attendance_date', { ascending: false });

    if (filterClass) query = query.eq('class_id', filterClass);
    if (filterStartDate) query = query.gte('attendance_date', filterStartDate);
    if (filterEndDate) query = query.lte('attendance_date', filterEndDate);

    const { data } = await query;
    setAttendance(data || []);
    setLoading(false);
  };

  const loadStudentStats = async () => {
    if (!selectedStudent) return;

    const start = filterStartDate || '2025-01-01';
    const end = filterEndDate || '2025-12-31';

    const { data } = await supabase.rpc('get_attendance_stats', {
      p_student_id: selectedStudent,
      p_start_date: start,
      p_end_date: end,
    });

    if (data && data.length > 0) {
      setStats(data[0]);
    }
  };

  const handleMarkAttendance = async () => {
    if (!selectedClass || !selectedDate) {
      toast({
        title: 'Missing Information',
        description: 'Please select class and date',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase
        .from('attendance')
        .delete()
        .eq('class_id', selectedClass)
        .eq('attendance_date', selectedDate);

      const attendanceRecords = students
        .filter(student => studentStatus[student.id])
        .map(student => ({
          student_id: student.id,
          class_id: selectedClass,
          attendance_date: selectedDate,
          status: studentStatus[student.id],
          marked_by: user.id,
          academic_year: '2025',
          remarks: studentRemarks[student.id] || null,
        }));

      if (attendanceRecords.length === 0) {
        toast({
          title: 'No Status Marked',
          description: 'Please mark attendance for at least one student',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.from('attendance').insert(attendanceRecords);
      if (error) throw error;

      toast({
        title: 'Success',
        description: `Attendance saved for ${attendanceRecords.length} students`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      present: { icon: Check, className: 'bg-green-100 text-green-800', label: 'Present' },
      absent: { icon: X, className: 'bg-red-100 text-red-800', label: 'Absent' },
      late: { icon: Clock, className: 'bg-yellow-100 text-yellow-800', label: 'Late' },
      excused: { icon: FileText, className: 'bg-blue-100 text-blue-800', label: 'Excused' },
    };
    const config = configs[status as keyof typeof configs];
    if (!config) return null;
    const Icon = config.icon;
    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Student ID', 'Student Name', 'Status', 'Remarks'];
    const rows = attendance.map(a => [
      a.attendance_date,
      a.student?.unique_id || '',
      a.student?.full_name || '',
      a.status,
      a.remarks || '',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance Management</h1>
        <p className="text-slate-500 mt-1">Comprehensive attendance tracking and analytics</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="mark">
            <Calendar className="w-4 h-4 mr-2" />
            Mark
          </TabsTrigger>
          <TabsTrigger value="view">
            <Users className="w-4 h-4 mr-2" />
            View
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mark" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mark Attendance</CardTitle>
              <CardDescription>Record daily attendance for students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(cls => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.class_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              </div>

              {students.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Roll No</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map(student => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.unique_id}</TableCell>
                          <TableCell>{student.full_name}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {(['present', 'absent', 'late', 'excused'] as const).map(status => (
                                <Button
                                  key={status}
                                  size="sm"
                                  variant={studentStatus[student.id] === status ? 'default' : 'outline'}
                                  onClick={() => setStudentStatus({ ...studentStatus, [student.id]: status })}
                                  className="capitalize"
                                >
                                  {status[0].toUpperCase()}
                                </Button>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder="Optional"
                              value={studentRemarks[student.id] || ''}
                              onChange={(e) => setStudentRemarks({
                                ...studentRemarks,
                                [student.id]: e.target.value,
                              })}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={handleMarkAttendance} disabled={loading || students.length === 0}>
                  Save Attendance
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>View Attendance</CardTitle>
                  <CardDescription>Browse and filter attendance records</CardDescription>
                </div>
                <Button variant="outline" onClick={exportToCSV} disabled={attendance.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All Classes</SelectItem>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.class_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="space-y-2">
                  <Input
                    type="date"
                    placeholder="Start Date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    type="date"
                    placeholder="End Date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map(att => (
                      <TableRow key={att.id}>
                        <TableCell>{att.attendance_date}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{att.student?.full_name}</div>
                            <div className="text-sm text-slate-500">{att.student?.unique_id}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(att.status)}</TableCell>
                        <TableCell>{att.remarks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {attendance.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No attendance records found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={filterClass} onValueChange={(val) => {
              setFilterClass(val);
              if (val) loadStudentsForClass(val);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.class_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map(stu => (
                  <SelectItem key={stu.id} value={stu.id}>
                    {stu.full_name} ({stu.unique_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                placeholder="Start"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
              <Input
                type="date"
                placeholder="End"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_days}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Present</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.present_days}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Absent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.absent_days}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Late</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats.late_days}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.attendance_rate.toFixed(1)}%</div>
                  <p className="text-xs text-slate-500 mt-1">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    Overall
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {!stats && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <p className="text-lg font-medium text-slate-700 mb-2">
                  Select Student to View Stats
                </p>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Choose a class and student to see detailed attendance analytics
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
