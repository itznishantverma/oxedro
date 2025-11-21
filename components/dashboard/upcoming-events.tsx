'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export function UpcomingEvents() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Coming Soon</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Event management features will be available soon. You'll be able to schedule and track all upcoming school events here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
