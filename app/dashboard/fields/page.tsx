'use client';

import { useEffect, useState } from 'react';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Database as DatabaseIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Role = Database['public']['Tables']['roles']['Row'];
type FieldDefinition = Database['public']['Tables']['role_field_definitions']['Row'];
type FieldType = 'text' | 'number' | 'date' | 'select' | 'boolean' | 'email' | 'phone' | 'textarea';

export default function FieldsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    field_name: '',
    field_label: '',
    field_type: 'text' as FieldType,
    is_required: false,
    field_options: '',
  });
  const { can } = useAuth();
  const { toast } = useToast();

  const canCreate = can('fields', 'create');
  const canDelete = can('fields', 'delete');

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      loadFields(selectedRole);
    }
  }, [selectedRole]);

  const loadRoles = async () => {
    const { data } = await supabase.from('roles').select('*').order('role_name');
    if (data) setRoles(data);
  };

  const loadFields = async (roleId: string) => {
    const { data } = await supabase
      .from('role_field_definitions')
      .select('*')
      .eq('role_id', roleId)
      .order('display_order');

    if (data) setFields(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRole) return;

    const fieldOptions =
      formData.field_type === 'select' && formData.field_options
        ? formData.field_options.split(',').map((opt) => opt.trim())
        : [];

    const { error } = await supabase.from('role_field_definitions').insert({
      role_id: selectedRole,
      field_name: formData.field_name.toLowerCase().replace(/\s+/g, '_'),
      field_label: formData.field_label,
      field_type: formData.field_type,
      is_required: formData.is_required,
      field_options: fieldOptions,
      display_order: fields.length,
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Field added successfully',
      });
      setDialogOpen(false);
      setFormData({
        field_name: '',
        field_label: '',
        field_type: 'text',
        is_required: false,
        field_options: '',
      });
      loadFields(selectedRole);
    }
  };

  const handleDelete = async (fieldId: string) => {
    const { error } = await supabase
      .from('role_field_definitions')
      .delete()
      .eq('id', fieldId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Field deleted successfully',
      });
      if (selectedRole) loadFields(selectedRole);
    }
  };

  const fieldTypes: { value: FieldType; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Dropdown' },
    { value: 'boolean', label: 'Yes/No' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'textarea', label: 'Text Area' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dynamic Fields</h1>
        <p className="text-slate-500 mt-1">Manage custom fields for each role</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Role</CardTitle>
          <CardDescription>Choose a role to manage its custom fields</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.role_name} ({role.role_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {canCreate && selectedRole && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Field
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Custom Field</DialogTitle>
                    <DialogDescription>
                      Create a new field for this role
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="field_label">Field Label</Label>
                      <Input
                        id="field_label"
                        value={formData.field_label}
                        onChange={(e) =>
                          setFormData({ ...formData, field_label: e.target.value })
                        }
                        placeholder="e.g., Blood Group"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="field_name">Field Name (Internal)</Label>
                      <Input
                        id="field_name"
                        value={formData.field_name}
                        onChange={(e) =>
                          setFormData({ ...formData, field_name: e.target.value })
                        }
                        placeholder="e.g., blood_group"
                        required
                      />
                      <p className="text-xs text-slate-500">
                        Use lowercase with underscores
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="field_type">Field Type</Label>
                      <Select
                        value={formData.field_type}
                        onValueChange={(value: FieldType) =>
                          setFormData({ ...formData, field_type: value })
                        }
                      >
                        <SelectTrigger id="field_type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.field_type === 'select' && (
                      <div className="space-y-2">
                        <Label htmlFor="field_options">Options (comma-separated)</Label>
                        <Input
                          id="field_options"
                          value={formData.field_options}
                          onChange={(e) =>
                            setFormData({ ...formData, field_options: e.target.value })
                          }
                          placeholder="e.g., A+, B+, O+, AB+"
                          required
                        />
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_required"
                        checked={formData.is_required}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_required: checked as boolean })
                        }
                      />
                      <Label htmlFor="is_required" className="cursor-pointer">
                        Required field
                      </Label>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Add Field</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedRole && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Fields</CardTitle>
            <CardDescription>
              {fields.length} field{fields.length !== 1 ? 's' : ''} defined for this role
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <DatabaseIcon className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p>No custom fields defined for this role</p>
                <p className="text-sm mt-1">Add fields to customize the user form</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field Label</TableHead>
                    <TableHead>Field Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Options</TableHead>
                    {canDelete && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field) => (
                    <TableRow key={field.id}>
                      <TableCell className="font-medium">{field.field_label}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                          {field.field_name}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{field.field_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {field.is_required ? (
                          <Badge variant="destructive">Required</Badge>
                        ) : (
                          <Badge variant="secondary">Optional</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {field.field_options && (field.field_options as any[]).length > 0 ? (
                          <div className="text-xs text-slate-600">
                            {(field.field_options as any[]).join(', ')}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      {canDelete && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(field.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedRole && (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <DatabaseIcon className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <p>Select a role above to manage its custom fields</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
