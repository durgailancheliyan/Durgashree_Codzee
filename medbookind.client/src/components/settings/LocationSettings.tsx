import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { locationService } from '@/services/location.service';

interface LocationDetails {
  id?: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  practiceId: string;
  email?: string; // Add email to match usage in form
}

interface LocationSettingsProps {
  userId?: string | null;
  showStaffMapping?: boolean;
}

const LocationSettings: React.FC<LocationSettingsProps> = ({ userId, showStaffMapping }) => {
  const [locations, setLocations] = useState<LocationDetails[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationDetails | null>(null);
  const [pincodeRequired, setPincodeRequired] = useState(true);
  const [form, setForm] = useState<LocationDetails>({
    name: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
    practiceId: '',
    email: '',
  });

  React.useEffect(() => {
    if (userId) {
      locationService.getLocationsByUserId(userId)
        .then(setLocations)
        .catch(() => {
          toast.error('Failed to load locations');
        });
    }
  }, [userId]);

  const resetForm = () => {
    setForm({
      name: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      phone: '',
      practiceId: '',
      email: '',
    });
    setEditingLocation(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLocation && editingLocation.id) {
        // Edit existing
        const updated = await locationService.updateLocation(editingLocation.id!, {
          ...form,
          addressConfig: { requirePincode: pincodeRequired },
        } as LocationDetails & { addressConfig?: object });
        setLocations(locs => locs.map(l => l.id === updated.id ? updated : l));
        toast.success('Location updated');
      } else {
        // Add new
        const created = await locationService.createLocation(form);
        setLocations(locs => [...locs, created]);
        toast.success('Location added');
      }
      setShowForm(false);
      resetForm();
    } catch {
      toast.error('Failed to save location');
    }
  };

  const handleEdit = (loc: LocationDetails) => {
    setEditingLocation(loc);
    setForm({ ...loc });
    setShowForm(true);
  };

  const handleDelete = async (id?: string) => {
    if (!id) {
      toast.error('Invalid location ID');
      return;
    }
    try {
      await locationService.deleteLocation(id);
      setLocations(locs => locs.filter(loc => loc.id !== id));
      toast.success('Location deleted');
    } catch {
      toast.error('Failed to delete location');
    }
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow border">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="py-2 px-3 text-left">Name</th>
              <th className="py-2 px-3 text-left">Address</th>
              <th className="py-2 px-3 text-left">Phone</th>
              <th className="py-2 px-3 text-left">Email</th>
              <th className="py-2 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-muted-foreground">
                  No locations added yet
                </td>
              </tr>
            ) : (
              locations.map((loc) => (
                <tr key={loc.id} className="border-t">
                  <td className="py-2 px-3">{loc.name}</td>
                  <td className="py-2 px-3">{loc.address}</td>
                  <td className="py-2 px-3">{loc.phone}</td>
                  <td className="py-2 px-3">{loc.email}</td>
                  <td className="py-2 px-3 flex gap-2 justify-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(loc)}
                      aria-label="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(loc.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Locations</h3>
        <Button onClick={handleAddNew} className="flex items-center gap-2" variant="default">
          <Plus className="w-4 h-4" /> Add New Location
        </Button>
      </div>
      {showForm && (
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted p-4 rounded-lg mb-4">
          <div className="space-y-2">
            <label htmlFor="name">Name</label>
            <input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="input" />
          </div>
          <div className="space-y-2">
            <label htmlFor="address">Address</label>
            <input id="address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required className="input" />
          </div>
          <div className="space-y-2">
            <label htmlFor="city">City</label>
            <input id="city" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="input" />
          </div>
          <div className="space-y-2">
            <label htmlFor="state">State</label>
            <input id="state" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="input" />
          </div>
          <div className="space-y-2">
            <label htmlFor="postalCode">Postal Code</label>
            <input id="postalCode" value={form.postalCode} onChange={e => setForm({ ...form, postalCode: e.target.value })} className="input" />
          </div>
          <div className="space-y-2">
            <label htmlFor="phone">Phone</label>
            <input id="phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" />
          </div>
          <div className="space-y-2">
            <label htmlFor="email">Email</label>
            <input id="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" />
          </div>
          <div className="space-y-2">
            <label htmlFor="practiceId">Practice ID</label>
            <input id="practiceId" value={form.practiceId} onChange={e => setForm({ ...form, practiceId: e.target.value })} required className="input" />
          </div>
          <div className="col-span-2 flex gap-2 justify-end mt-2">
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
            <Button type="submit">{editingLocation ? 'Update' : 'Add'} Location</Button>
          </div>
        </form>
      )}

      {showStaffMapping && locations.length > 0 && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold mb-2">Staff mapping & address config</h3>
          <p className="text-sm text-gray-500 mb-4">Assign staff and doctors to each branch.</p>
          <label className="flex items-center gap-2 text-sm mb-4">
            <input type="checkbox" checked={pincodeRequired} onChange={(e) => setPincodeRequired(e.target.checked)} />
            Require PIN/postal code on branch addresses
          </label>
          {locations.map((loc) => (
            <StaffMappingRow key={loc.id} locationId={loc.id!} locationName={loc.name} />
          ))}
        </div>
      )}
    </div>
  );
};

function StaffMappingRow({ locationId, locationName }: { locationId: string; locationName: string }) {
  const [staff, setStaff] = React.useState<Array<{ id: string; firstName: string; lastName: string; role: string }>>([]);
  const [selected, setSelected] = React.useState<string[]>([]);

  React.useEffect(() => {
    locationService.getLocationStaff(locationId).then((list) => {
      setStaff(list);
      setSelected(list.filter((s) => s.locationId === locationId).map((s) => s.id));
    });
  }, [locationId]);

  const save = async () => {
    await locationService.updateLocationStaff(locationId, selected);
    toast.success(`Staff updated for ${locationName}`);
  };

  return (
    <div className="mb-4 p-4 border rounded-lg bg-slate-50">
      <p className="font-medium text-sm mb-2">{locationName}</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {staff.map((s) => (
          <label key={s.id} className="flex items-center gap-1 text-xs border bg-white px-2 py-1 rounded">
            <input
              type="checkbox"
              checked={selected.includes(s.id)}
              onChange={(e) =>
                setSelected((prev) =>
                  e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)
                )
              }
            />
            {s.firstName} {s.lastName} ({s.role})
          </label>
        ))}
      </div>
      <Button type="button" size="sm" onClick={save}>
        Save mapping
      </Button>
    </div>
  );
}

export default LocationSettings;