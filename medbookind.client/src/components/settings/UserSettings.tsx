import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UsersService, type RoleOption } from '@/services/users.service';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { LocationResponse, UserRequest, UserResponse } from '@/interfaces';
import { toast } from 'react-toastify';

function resolveRoleLabel(roleValue: string | undefined, options: RoleOption[]): string {
  if (!roleValue) return '—';
  const match = options.find((o) => o.id === roleValue || o.name === roleValue);
  return match?.name ?? roleValue;
}

const UserSettings: React.FC = () => {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [locations, setLocations] = useState<LocationResponse[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<UserRequest, 'id'>>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    role: '',
    locationId: '',
  });

  const loadData = async () => {
    try {
      const [usersRes, rolesRes, locRes] = await Promise.all([
        UsersService.getUsers(),
        UsersService.getRoleOptions(),
        UsersService.getPracticeLocations(),
      ]);
      setUsers(usersRes);
      setRoleOptions(rolesRes);
      setLocations(locRes);
    } catch {
      toast.error('Failed to load user settings');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    if (!form.role) {
      toast.error('Please select a role');
      return;
    }
    try {
      if (editingId) {
        await UsersService.updateUser(editingId, form);
        toast.success('User updated');
      } else {
        await UsersService.createUser(form);
        toast.success('User created');
      }
      setForm({ firstName: '', lastName: '', email: '', phone: '', role: '', locationId: '' });
      setEditingId(null);
      setShowAddForm(false);
      await loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save user');
    }
  };

  const handleEdit = (user: UserResponse) => {
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? '',
      role: user.role ?? '',
      locationId: user.locationId ?? '',
    });
    setEditingId(user.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await UsersService.deleteUser(id);
      toast.success('User deleted');
      await loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const permissionsByRole: Record<string, string[]> = {
    Admin: ['Manage practice', 'Manage users', 'Billing', 'Consult manager', 'All configuration'],
    Doctor: ['Consult manager', 'View patients', 'Treatment plans', 'Schedule'],
    Staff: ['Consult manager', 'Register patients', 'Appointments', 'Check-in/out'],
    Patient: ['Book appointments', 'View own records', 'Profile'],
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Role permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {Object.entries(permissionsByRole).map(([role, perms]) => (
            <div key={role} className="bg-white border rounded p-3">
              <p className="font-semibold text-cyan-700">{role}</p>
              <ul className="mt-1 list-disc list-inside text-gray-600">
                {perms.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Assign roles below to control what each user can access in the app.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Users</h3>
        <Button
          onClick={() => {
            setShowAddForm(true);
            setEditingId(null);
            setForm({ firstName: '', lastName: '', email: '', phone: '', role: '', locationId: '' });
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New User
        </Button>
      </div>

      {showAddForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border"
        >
          <div className="space-y-2">
            <Label>First Name</Label>
            <Input
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Last Name</Label>
            <Input
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={form.role || undefined}
              onValueChange={(value) => setForm({ ...form, role: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.length === 0 ? (
                  <SelectItem value="Staff">Staff (default)</SelectItem>
                ) : (
                  roleOptions.map((role) => (
                    <SelectItem key={`${role.kind}-${role.id}`} value={role.id}>
                      {role.name}
                      {role.kind === 'practice' ? ' (practice role)' : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {roleOptions.length === 0 && (
              <p className="text-xs text-amber-600">Add practice roles in onboarding or use system roles after refresh.</p>
            )}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Location</Label>
            <Select
              value={form.locationId || undefined}
              onValueChange={(value) => setForm({ ...form, locationId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No locations — add in Locations tab
                  </SelectItem>
                ) : (
                  locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 md:col-span-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">{editingId ? 'Update' : 'Add'}</Button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow border text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="py-2 px-3 text-left">Name</th>
              <th className="py-2 px-3 text-left">Email</th>
              <th className="py-2 px-3 text-left">Role</th>
              <th className="py-2 px-3 text-left">Location</th>
              <th className="py-2 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-muted-foreground">
                  No users in your practice yet
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="py-2 px-3">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="py-2 px-3">{user.email}</td>
                  <td className="py-2 px-3">{resolveRoleLabel(user.role, roleOptions)}</td>
                  <td className="py-2 px-3">
                    {locations.find((loc) => loc.id === user.locationId)?.name ?? '—'}
                  </td>
                  <td className="py-2 px-3 flex gap-2 justify-center">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(user)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => handleDelete(user.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserSettings;
