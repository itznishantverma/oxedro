'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  TrendingUp,
  Award,
  BarChart3,
  Download,
  Calendar,
  Filter
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

interface Subject {
  id: string;
  subject_name: string;
  subject_code: string;
}

interface Class {
  id: string;
  class_name: string;
}

interface ExamType {
  id: string;
  exam_name: string;
  exam_code: string;
  weightage: number;
}

interface Mark {
  id: string;
  student_id: string;
  subject_id: string;
  class_id: string;
  exam_type_id: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
  exam_date: string;
  academic_year: string;
  academic_term: string;
  remarks: string;
  student?: { full_name: string; unique_id: string };
  subject?: { subject_name: string };
  exam_type?: { exam_name: string };
}

interface Analytics {
  class_average: number;
  highest_score: number;
  lowest_score: number;
  total_students: number;
  pass_rate: number;
}

export default function MarksPage() {
  const [activeTab, setActiveTab] = useState('entry');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Form states
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);

  // Selected values
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('Term 1');
  const [examDate, setExamDate] = useState('');
  const [totalMarks, setTotalMarks] = useState('100');

  // Marks entry
  const [studentMarks, setStudentMarks] = useState<Record<string, string>>({});
  const [studentRemarks, setStudentRemarks] = useState<Record<string, string>>({});

  // Analytics
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterTerm, setFilterTerm] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudentsForClass(selectedClass);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (activeTab === 'view' || activeTab === 'analytics') {
      loadMarks();
    }
  }, [activeTab, filterClass, filterSubject, filterTerm]);

  const loadInitialData = async () => {
    try {
      const [classesRes, subjectsRes, examTypesRes] = await Promise.all([
        supabase.from('classes').select('*').eq('academic_year', '2025').eq('is_active', true),
        supabase.from('subjects').select('*').eq('is_active', true),
        supabase.from('exam_types').select('*').eq('academic_year', '2025').eq('is_active', true),
      ]);

      if (classesRes.data) setClasses(classesRes.data);
      if (subjectsRes.data) setSubjects(subjectsRes.data);
      if (examTypesRes.data) setExamTypes(examTypesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadStudentsForClass = async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from('student_classes')
        .select(`
          student_id,
          users!inner(id, full_name, unique_id)
        `)
        .eq('class_id', classId)
        .eq('academic_year', '2025');

      if (error) throw error;

      const studentsData = data?.map((sc: any) => ({
        id: sc.users.id,
        full_name: sc.users.full_name,
        unique_id: sc.users.unique_id,
      })) || [];

      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadMarks = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('marks')
        .select(`
          *,
          student:users!marks_student_id_fkey(full_name, unique_id),
          subject:subjects(subject_name),
          exam_type:exam_types(exam_name)
        `)
        .eq('academic_year', '2025')
        .order('exam_date', { ascending: false });

      if (filterClass) query = query.eq('class_id', filterClass);
      if (filterSubject) query = query.eq('subject_id', filterSubject);
      if (filterTerm) query = query.eq('academic_term', filterTerm);

      const { data, error } = await query;

      if (error) throw error;
      setMarks(data || []);

      if (filterClass && filterSubject) {
        loadAnalytics();
      }
    } catch (error) {
      console.error('Error loading marks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    if (!filterClass || !filterSubject) return;

    try {
      const { data, error } = await supabase
        .from('class_performance')
        .select('*')
        .eq('class_id', filterClass)
        .eq('subject_id', filterSubject)
        .eq('academic_year', '2025')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const passRate = marks.filter(m => m.percentage >= 40).length / marks.length * 100;
        setAnalytics({
          class_average: data.class_average || 0,
          highest_score: data.highest_score || 0,
          lowest_score: data.lowest_score || 0,
          total_students: data.total_students || 0,
          pass_rate: passRate || 0,
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleMarksEntry = async () => {
    if (!selectedClass || !selectedSubject || !selectedExamType || !examDate) {
      toast({
        title: 'Missing Information',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const marksToInsert = students
        .filter(student => studentMarks[student.id])
        .map(student => ({
          student_id: student.id,
          subject_id: selectedSubject,
          class_id: selectedClass,
          exam_type_id: selectedExamType,
          marks_obtained: parseFloat(studentMarks[student.id]),
          total_marks: parseFloat(totalMarks),
          exam_date: examDate,
          academic_year: '2025',
          academic_term: selectedTerm,
          entered_by: user.id,
          remarks: studentRemarks[student.id] || null,
        }));

      if (marksToInsert.length === 0) {
        toast({
          title: 'No Marks Entered',
          description: 'Please enter marks for at least one student',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.from('marks').insert(marksToInsert);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Marks saved for ${marksToInsert.length} students`,
      });

      setStudentMarks({});
      setStudentRemarks({});
      setSelectedClass('');
      setSelectedSubject('');
      setSelectedExamType('');
      setExamDate('');
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

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-100 text-green-800';
    if (percentage >= 80) return 'bg-blue-100 text-blue-800';
    if (percentage >= 70) return 'bg-cyan-100 text-cyan-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    if (percentage >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const exportToCSV = () => {
    const headers = ['Student ID', 'Student Name', 'Subject', 'Exam Type', 'Marks', 'Total', 'Percentage', 'Grade', 'Date'];
    const rows = marks.map(m => [
      m.student?.unique_id || '',
      m.student?.full_name || '',
      m.subject?.subject_name || '',
      m.exam_type?.exam_name || '',
      m.marks_obtained,
      m.total_marks,
      m.percentage?.toFixed(2) || '',
      m.grade || '',
      m.exam_date || '',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marks_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Marks Management</h1>
          <p className="text-slate-500 mt-1">Comprehensive marks tracking and analytics</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="entry" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Entry
          </TabsTrigger>
          <TabsTrigger value="view" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            View
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enter Marks</CardTitle>
              <CardDescription>Record exam marks for students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Label>Subject</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(sub => (
                        <SelectItem key={sub.id} value={sub.id}>{sub.subject_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Exam Type</Label>
                  <Select value={selectedExamType} onValueChange={setSelectedExamType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select exam type" />
                    </SelectTrigger>
                    <SelectContent>
                      {examTypes.map(exam => (
                        <SelectItem key={exam.id} value={exam.id}>
                          {exam.exam_name} ({exam.weightage}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Academic Term</Label>
                  <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Term 1">Term 1</SelectItem>
                      <SelectItem value="Term 2">Term 2</SelectItem>
                      <SelectItem value="Term 3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Exam Date</Label>
                  <Input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Total Marks</Label>
                  <Input
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value)}
                    min="1"
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
                        <TableHead>Marks Obtained</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map(student => {
                        const obtained = parseFloat(studentMarks[student.id] || '0');
                        const total = parseFloat(totalMarks);
                        const percentage = total > 0 ? (obtained / total * 100).toFixed(2) : '0';

                        return (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.unique_id}</TableCell>
                            <TableCell>{student.full_name}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                className="w-24"
                                value={studentMarks[student.id] || ''}
                                onChange={(e) => setStudentMarks({
                                  ...studentMarks,
                                  [student.id]: e.target.value,
                                })}
                                min="0"
                                max={totalMarks}
                              />
                            </TableCell>
                            <TableCell>
                              <Badge className={getGradeColor(parseFloat(percentage))}>
                                {percentage}%
                              </Badge>
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
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {students.length === 0 && selectedClass && (
                <div className="text-center py-8 text-slate-500">
                  No students found in this class
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  onClick={handleMarksEntry}
                  disabled={loading || students.length === 0}
                >
                  Save Marks
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
                  <CardTitle>View Marks</CardTitle>
                  <CardDescription>Browse and filter student marks</CardDescription>
                </div>
                <Button variant="outline" onClick={exportToCSV} disabled={marks.length === 0}>
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

                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All Subjects</SelectItem>
                    {subjects.map(sub => (
                      <SelectItem key={sub.id} value={sub.id}>{sub.subject_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterTerm} onValueChange={setFilterTerm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">All Terms</SelectItem>
                    <SelectItem value="Term 1">Term 1</SelectItem>
                    <SelectItem value="Term 2">Term 2</SelectItem>
                    <SelectItem value="Term 3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Exam Type</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marks.map(mark => (
                      <TableRow key={mark.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{mark.student?.full_name}</div>
                            <div className="text-sm text-slate-500">{mark.student?.unique_id}</div>
                          </div>
                        </TableCell>
                        <TableCell>{mark.subject?.subject_name}</TableCell>
                        <TableCell>{mark.exam_type?.exam_name}</TableCell>
                        <TableCell>{mark.marks_obtained} / {mark.total_marks}</TableCell>
                        <TableCell>
                          <Badge className={getGradeColor(mark.percentage)}>
                            {mark.percentage?.toFixed(2)}%
                          </Badge>
                        </TableCell>
                        <TableCell>{mark.exam_date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {marks.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No marks found. Try adjusting the filters.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.class_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(sub => (
                  <SelectItem key={sub.id} value={sub.id}>{sub.subject_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterTerm} onValueChange={setFilterTerm}>
              <SelectTrigger>
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Terms</SelectItem>
                <SelectItem value="Term 1">Term 1</SelectItem>
                <SelectItem value="Term 2">Term 2</SelectItem>
                <SelectItem value="Term 3">Term 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Class Average</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.class_average.toFixed(2)}%</div>
                  <p className="text-xs text-slate-500 mt-1">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    Overall performance
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {analytics.highest_score.toFixed(2)}%
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Top performer</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Lowest Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {analytics.lowest_score.toFixed(2)}%
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Needs attention</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.pass_rate.toFixed(0)}%</div>
                  <p className="text-xs text-slate-500 mt-1">
                    {analytics.total_students} students
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {!analytics && (
            <Card>
              <CardContent className="py-12 text-center">
                <Filter className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <p className="text-lg font-medium text-slate-700 mb-2">
                  Select Filters to View Analytics
                </p>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Choose a class and subject to see detailed performance analytics
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
