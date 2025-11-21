'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Download } from 'lucide-react';

interface GenerateReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateReportModal({ open, onOpenChange }: GenerateReportModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reportType: '',
    format: 'pdf',
    includeCharts: true,
    includeDetails: true,
    includeSummary: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success('Report generated successfully!', {
        description: 'Your report is ready for download.',
        action: {
          label: 'Download',
          onClick: () => console.log('Download clicked'),
        },
      });

      onOpenChange(false);
      setFormData({
        reportType: '',
        format: 'pdf',
        includeCharts: true,
        includeDetails: true,
        includeSummary: true,
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Generate Report</DialogTitle>
          <DialogDescription>
            Select report type and format to generate custom reports.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type *</Label>
              <Select value={formData.reportType} onValueChange={(value) => setFormData({ ...formData, reportType: value })} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student-performance">Student Performance Report</SelectItem>
                  <SelectItem value="attendance">Attendance Report</SelectItem>
                  <SelectItem value="class-summary">Class Summary Report</SelectItem>
                  <SelectItem value="teacher">Teacher Report</SelectItem>
                  <SelectItem value="marks">Marks Report</SelectItem>
                  <SelectItem value="custom">Custom Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Report Format *</Label>
              <Select value={formData.format} onValueChange={(value) => setFormData({ ...formData, format: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel (XLSX)</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Include in Report</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeCharts"
                    checked={formData.includeCharts}
                    onCheckedChange={(checked) => setFormData({ ...formData, includeCharts: checked as boolean })}
                  />
                  <label htmlFor="includeCharts" className="text-sm cursor-pointer">
                    Charts and Graphs
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeDetails"
                    checked={formData.includeDetails}
                    onCheckedChange={(checked) => setFormData({ ...formData, includeDetails: checked as boolean })}
                  />
                  <label htmlFor="includeDetails" className="text-sm cursor-pointer">
                    Detailed Breakdown
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeSummary"
                    checked={formData.includeSummary}
                    onCheckedChange={(checked) => setFormData({ ...formData, includeSummary: checked as boolean })}
                  />
                  <label htmlFor="includeSummary" className="text-sm cursor-pointer">
                    Summary Statistics
                  </label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Generate Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
