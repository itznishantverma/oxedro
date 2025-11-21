'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Plus, Bell, FileText } from 'lucide-react';
import { useState } from 'react';
import { AddStudentModal } from './modals/add-student-modal';
import { CreateClassModal } from './modals/create-class-modal';
import { SendNoticeModal } from './modals/send-notice-modal';
import { GenerateReportModal } from './modals/generate-report-modal';

export function QuickActions() {
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [createClassOpen, setCreateClassOpen] = useState(false);
  const [sendNoticeOpen, setSendNoticeOpen] = useState(false);
  const [generateReportOpen, setGenerateReportOpen] = useState(false);

  const actions = [
    {
      title: 'Add Student',
      icon: UserPlus,
      bgColor: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      onClick: () => setAddStudentOpen(true),
    },
    {
      title: 'Create Class',
      icon: Plus,
      bgColor: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      onClick: () => setCreateClassOpen(true),
    },
    {
      title: 'Send Notice',
      icon: Bell,
      bgColor: 'bg-yellow-500',
      hoverColor: 'hover:bg-yellow-600',
      onClick: () => setSendNoticeOpen(true),
    },
    {
      title: 'Generate Report',
      icon: FileText,
      bgColor: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      onClick: () => setGenerateReportOpen(true),
    },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.title}
                  onClick={action.onClick}
                  className={`${action.bgColor} ${action.hoverColor} text-white h-24 flex flex-col items-center justify-center space-y-2 transition-all duration-200 hover:scale-105 hover:shadow-lg`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{action.title}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AddStudentModal open={addStudentOpen} onOpenChange={setAddStudentOpen} />
      <CreateClassModal open={createClassOpen} onOpenChange={setCreateClassOpen} />
      <SendNoticeModal open={sendNoticeOpen} onOpenChange={setSendNoticeOpen} />
      <GenerateReportModal open={generateReportOpen} onOpenChange={setGenerateReportOpen} />
    </>
  );
}
