import React from 'react';
import { Search, Calendar, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SmartFilterValues {
  dateFrom: string;
  dateTo: string;
  doctorId: string;
  patientSearch: string;
}

interface SmartFiltersProps {
  values: SmartFilterValues;
  onChange: (values: SmartFilterValues) => void;
  doctors?: Array<{ id: string; name: string }>;
  showDoctor?: boolean;
  compact?: boolean;
}

const SmartFilters: React.FC<SmartFiltersProps> = ({
  values,
  onChange,
  doctors = [],
  showDoctor = true,
  compact = false,
}) => {
  const set = (patch: Partial<SmartFilterValues>) => onChange({ ...values, ...patch });

  return (
    <div
      className={`flex flex-wrap items-end gap-3 ${compact ? '' : 'p-4 bg-white border rounded-lg shadow-sm'}`}
    >
      <div className={compact ? 'w-36' : 'min-w-[140px]'}>
        <label className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1">
          <Calendar className="h-3 w-3" /> From
        </label>
        <Input
          type="date"
          className="h-8 text-xs"
          value={values.dateFrom}
          onChange={(e) => set({ dateFrom: e.target.value })}
        />
      </div>
      <div className={compact ? 'w-36' : 'min-w-[140px]'}>
        <label className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1">
          <Calendar className="h-3 w-3" /> To
        </label>
        <Input
          type="date"
          className="h-8 text-xs"
          value={values.dateTo}
          onChange={(e) => set({ dateTo: e.target.value })}
        />
      </div>
      {showDoctor && (
        <div className={compact ? 'w-40' : 'min-w-[160px]'}>
          <label className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1">
            <User className="h-3 w-3" /> Doctor
          </label>
          <Select
            value={values.doctorId || 'all'}
            onValueChange={(v) => set({ doctorId: v === 'all' ? '' : v })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="All doctors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All doctors</SelectItem>
              {doctors.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className={compact ? 'flex-1 min-w-[160px]' : 'min-w-[200px] flex-1'}>
        <label className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1">
          <Search className="h-3 w-3" /> Patient search
        </label>
        <Input
          className="h-8 text-xs"
          placeholder="Name or email..."
          value={values.patientSearch}
          onChange={(e) => set({ patientSearch: e.target.value })}
        />
      </div>
      <button
        type="button"
        className="h-8 px-3 text-xs border rounded-md hover:bg-gray-50"
        onClick={() =>
          onChange({ dateFrom: '', dateTo: '', doctorId: '', patientSearch: '' })
        }
      >
        Clear
      </button>
    </div>
  );
};

export default SmartFilters;
