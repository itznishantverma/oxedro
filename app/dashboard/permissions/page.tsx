'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Shield, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

type Role = Database['public']['Tables']['roles']['Row'];
type Resource = Database['public']['Tables']['resource_permissions']['Row'];
type Action = Database['public']['Tables']['resource_permission_actions']['Row'];
type Scope = 'all' | 'own' | 'department' | 'class' | 'children';

interface Permission {
  resource_id: string;
  action_id: string;
  scope: Scope;
}

export default function PermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { can } = useAuth();
  const { toast } = useToast();

  const canEdit = can('permissions', 'edit');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      loadRolePermissions(selectedRole);
    }
  }, [selectedRole]);

  const loadData = async () => {
    setLoading(true);
    const [rolesRes, resourcesRes, actionsRes] = await Promise.all([
      supabase.from('roles').select('*').order('role_name'),
      supabase.from('resource_permissions').select('*').order('resource_label'),
      supabase.from('resource_permission_actions').select('*').order('action_name'),
    ]);

    if (rolesRes.data) setRoles(rolesRes.data);
    if (resourcesRes.data) setResources(resourcesRes.data);
    if (actionsRes.data) setActions(actionsRes.data);
    setLoading(false);
  };

  const loadRolePermissions = async (roleId: string) => {
    const { data } = await supabase
      .from('role_resource_permissions')
      .select('resource_id, action_id, scope')
      .eq('role_id', roleId);

    if (data) {
      setPermissions(data as Permission[]);
    }
  };

  const hasPermission = (resourceId: string, actionId: string): boolean => {
    return permissions.some(
      (p) => p.resource_id === resourceId && p.action_id === actionId
    );
  };

  const getPermissionScope = (resourceId: string, actionId: string): Scope | undefined => {
    return permissions.find(
      (p) => p.resource_id === resourceId && p.action_id === actionId
    )?.scope;
  };

  const togglePermission = (resourceId: string, actionId: string, scope: Scope) => {
    const exists = hasPermission(resourceId, actionId);

    if (exists) {
      setPermissions(
        permissions.filter(
          (p) => !(p.resource_id === resourceId && p.action_id === actionId)
        )
      );
    } else {
      setPermissions([...permissions, { resource_id: resourceId, action_id: actionId, scope }]);
    }
  };

  const updateScope = (resourceId: string, actionId: string, scope: Scope) => {
    setPermissions(
      permissions.map((p) =>
        p.resource_id === resourceId && p.action_id === actionId ? { ...p, scope } : p
      )
    );
  };

  const handleSave = async () => {
    if (!selectedRole) return;

    setSaving(true);

    await supabase
      .from('role_resource_permissions')
      .delete()
      .eq('role_id', selectedRole);

    if (permissions.length > 0) {
      const inserts = permissions.map((p) => ({
        role_id: selectedRole,
        resource_id: p.resource_id,
        action_id: p.action_id,
        scope: p.scope,
      }));

      const { error } = await supabase
        .from('role_resource_permissions')
        .insert(inserts);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        setSaving(false);
        return;
      }
    }

    toast({
      title: 'Success',
      description: 'Permissions saved successfully',
    });
    setSaving(false);
  };

  const scopes: { value: Scope; label: string; description: string }[] = [
    { value: 'all', label: 'All', description: 'Access to all records' },
    { value: 'own', label: 'Own', description: 'Only own records' },
    { value: 'department', label: 'Department', description: 'Department-level access' },
    { value: 'class', label: 'Class', description: 'Class-level access' },
    { value: 'children', label: 'Children', description: 'Parent accessing children records' },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Permissions Management</h1>
        <p className="text-slate-500 mt-1">Assign resource permissions to roles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Role</CardTitle>
          <CardDescription>Choose a role to manage its permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4" />
                        <span>{role.role_name}</span>
                        <Badge variant="outline" className="ml-2">
                          {role.role_code}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {canEdit && selectedRole && (
              <Button onClick={handleSave} disabled={saving} className="mt-6">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Permissions'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedRole && (
        <Card>
          <CardHeader>
            <CardTitle>Resource Permissions</CardTitle>
            <CardDescription>
              Configure what actions this role can perform on each resource
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {resources.map((resource) => (
                <div key={resource.id} className="border rounded-lg p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900">
                      {resource.resource_label}
                    </h3>
                    <p className="text-sm text-slate-500">{resource.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {actions.map((action) => {
                      const isChecked = hasPermission(resource.id, action.id);
                      const currentScope = getPermissionScope(resource.id, action.id);

                      return (
                        <div
                          key={action.id}
                          className="border rounded p-3 space-y-2 bg-slate-50"
                        >
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`${resource.id}-${action.id}`}
                              checked={isChecked}
                              onCheckedChange={() =>
                                togglePermission(resource.id, action.id, 'all')
                              }
                              disabled={!canEdit}
                            />
                            <Label
                              htmlFor={`${resource.id}-${action.id}`}
                              className="font-medium cursor-pointer"
                            >
                              {action.action_label}
                            </Label>
                          </div>

                          {isChecked && (
                            <div className="ml-6 space-y-1">
                              <Label className="text-xs text-slate-600">Scope:</Label>
                              <Select
                                value={currentScope}
                                onValueChange={(value: Scope) =>
                                  updateScope(resource.id, action.id, value)
                                }
                                disabled={!canEdit}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {scopes.map((scope) => (
                                    <SelectItem key={scope.value} value={scope.value}>
                                      <div>
                                        <div className="font-medium">{scope.label}</div>
                                        <div className="text-xs text-slate-500">
                                          {scope.description}
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedRole && (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <Shield className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <p>Select a role above to manage its permissions</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
