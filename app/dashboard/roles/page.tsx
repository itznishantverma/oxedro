'use client';
export const dynamic = 'force-dynamic';

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
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Role = Database['public']['Tables']['roles']['Row'];

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    role_name: '',
    role_code: '',
    description: '',
  });
  const { can } = useAuth();
  const { toast } = useToast();

  const canCreate = can('roles', 'create');
  const canEdit = can('roles', 'edit');
  const canDelete = can('roles', 'delete');

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load roles',
        variant: 'destructive',
      });
    } else {
      setRoles(data || []);
    }
    setLoading(false);
  };

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        role_name: role.role_name,
        role_code: role.role_code,
        description: role.description || '',
      });
    } else {
      setEditingRole(null);
      setFormData({
        role_name: '',
        role_code: '',
        description: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.role_code.length !== 2) {
      toast({
        title: 'Validation Error',
        description: 'Role code must be exactly 2 characters',
        variant: 'destructive',
      });
      return;
    }

    if (editingRole) {
      const { error } = await supabase
        .from('roles')
        .update({
          role_name: formData.role_name,
          description: formData.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingRole.id);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Role updated successfully',
        });
        setDialogOpen(false);
        loadRoles();
      }
    } else {
      const { error } = await supabase.from('roles').insert({
        role_name: formData.role_name,
        role_code: formData.role_code.toUpperCase(),
        description: formData.description,
        is_system_role: false,
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
          description: 'Role created successfully',
        });
        setDialogOpen(false);
        loadRoles();
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteRole) return;

    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', deleteRole.id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Role deleted successfully',
      });
      loadRoles();
    }
    setDeleteRole(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Roles Management</h1>
          <p className="text-slate-500 mt-1">Create and manage user roles</p>
        </div>
        {canCreate && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingRole ? 'Edit Role' : 'Create New Role'}
                </DialogTitle>
                <DialogDescription>
                  {editingRole
                    ? 'Update role information'
                    : 'Add a new role to the system'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role_name">Role Name</Label>
                  <Input
                    id="role_name"
                    value={formData.role_name}
                    onChange={(e) =>
                      setFormData({ ...formData, role_name: e.target.value })
                    }
                    placeholder="e.g., Lab Assistant"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role_code">Role Code (2 letters)</Label>
                  <Input
                    id="role_code"
                    value={formData.role_code}
                    onChange={(e) =>
                      setFormData({ ...formData, role_code: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g., LA"
                    maxLength={2}
                    required
                    disabled={!!editingRole}
                  />
                  <p className="text-xs text-slate-500">
                    Exactly 2 characters, cannot be changed after creation
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe the role's purpose"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingRole ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Roles</CardTitle>
          <CardDescription>
            {roles.length} role{roles.length !== 1 ? 's' : ''} in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading roles...</div>
          ) : roles.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No roles found. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  {(canEdit || canDelete) && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-slate-500" />
                        <span>{role.role_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{role.role_code}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {role.description || '-'}
                    </TableCell>
                    <TableCell>
                      {role.is_system_role ? (
                        <Badge>System</Badge>
                      ) : (
                        <Badge variant="secondary">Custom</Badge>
                      )}
                    </TableCell>
                    {(canEdit || canDelete) && (
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(role)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete && !role.is_system_role && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteRole(role)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteRole} onOpenChange={() => setDeleteRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the role &quot;{deleteRole?.role_name}&quot;. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
