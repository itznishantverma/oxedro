'use client';

import { useEffect, useState } from 'react';
import { supabase, Database } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type FieldDefinition = Database['public']['Tables']['role_field_definitions']['Row'];

interface DynamicFieldsFormProps {
  roleId: string;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

export function DynamicFieldsForm({ roleId, values, onChange }: DynamicFieldsFormProps) {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFields();
  }, [roleId]);

  const loadFields = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('role_field_definitions')
      .select('*')
      .eq('role_id', roleId)
      .order('display_order');

    if (data) {
      setFields(data);
    }
    setLoading(false);
  };

  const handleChange = (fieldName: string, value: string) => {
    onChange({ ...values, [fieldName]: value });
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Loading fields...</div>;
  }

  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="border-t pt-4">
        <h3 className="font-semibold text-slate-900 mb-4">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.field_name}>
                {field.field_label}
                {field.is_required && <span className="text-red-500 ml-1">*</span>}
              </Label>

              {field.field_type === 'text' && (
                <Input
                  id={field.field_name}
                  value={values[field.field_name] || ''}
                  onChange={(e) => handleChange(field.field_name, e.target.value)}
                  required={field.is_required}
                />
              )}

              {field.field_type === 'number' && (
                <Input
                  id={field.field_name}
                  type="number"
                  value={values[field.field_name] || ''}
                  onChange={(e) => handleChange(field.field_name, e.target.value)}
                  required={field.is_required}
                />
              )}

              {field.field_type === 'email' && (
                <Input
                  id={field.field_name}
                  type="email"
                  value={values[field.field_name] || ''}
                  onChange={(e) => handleChange(field.field_name, e.target.value)}
                  required={field.is_required}
                />
              )}

              {field.field_type === 'phone' && (
                <Input
                  id={field.field_name}
                  type="tel"
                  value={values[field.field_name] || ''}
                  onChange={(e) => handleChange(field.field_name, e.target.value)}
                  required={field.is_required}
                />
              )}

              {field.field_type === 'date' && (
                <Input
                  id={field.field_name}
                  type="date"
                  value={values[field.field_name] || ''}
                  onChange={(e) => handleChange(field.field_name, e.target.value)}
                  required={field.is_required}
                />
              )}

              {field.field_type === 'textarea' && (
                <Textarea
                  id={field.field_name}
                  value={values[field.field_name] || ''}
                  onChange={(e) => handleChange(field.field_name, e.target.value)}
                  required={field.is_required}
                  rows={3}
                />
              )}

              {field.field_type === 'select' && (
                <Select
                  value={values[field.field_name] || ''}
                  onValueChange={(value) => handleChange(field.field_name, value)}
                  required={field.is_required}
                >
                  <SelectTrigger id={field.field_name}>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.field_options as any[])?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {field.field_type === 'boolean' && (
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id={field.field_name}
                    checked={values[field.field_name] === 'true'}
                    onCheckedChange={(checked) =>
                      handleChange(field.field_name, checked ? 'true' : 'false')
                    }
                  />
                  <Label htmlFor={field.field_name} className="cursor-pointer">
                    Yes
                  </Label>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
