'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface SendNoticeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendNoticeModal({ open, onOpenChange }: SendNoticeModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    noticeType: '',
    targetAudience: '',
    content: '',
    priority: 'medium',
    sendEmail: false,
    sendSMS: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      toast.success('Notice sent successfully!');
      onOpenChange(false);
      setFormData({
        title: '',
        noticeType: '',
        targetAudience: '',
        content: '',
        priority: 'medium',
        sendEmail: false,
        sendSMS: false,
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to send notice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Send Notice</DialogTitle>
          <DialogDescription>
            Compose and send a notice to selected audience.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Notice Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter notice title"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="noticeType">Notice Type *</Label>
                <Select value={formData.noticeType} onValueChange={(value) => setFormData({ ...formData, noticeType: value })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="information">Information</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience *</Label>
                <Select value={formData.targetAudience} onValueChange={(value) => setFormData({ ...formData, targetAudience: value })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="teachers">All Teachers</SelectItem>
                    <SelectItem value="students">All Students</SelectItem>
                    <SelectItem value="parents">All Parents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority Level</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Notice Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter notice content..."
                rows={6}
                required
              />
            </div>

            <div className="space-y-3">
              <Label>Notification Options</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendEmail"
                  checked={formData.sendEmail}
                  onCheckedChange={(checked) => setFormData({ ...formData, sendEmail: checked as boolean })}
                />
                <label htmlFor="sendEmail" className="text-sm cursor-pointer">
                  Send email notification
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendSMS"
                  checked={formData.sendSMS}
                  onCheckedChange={(checked) => setFormData({ ...formData, sendSMS: checked as boolean })}
                />
                <label htmlFor="sendSMS" className="text-sm cursor-pointer">
                  Send SMS notification
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Notice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
