import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

const BookAppointment: React.FC = () => {
  const navigate = useNavigate();
  const [scheduledAt, setScheduledAt] = useState('');
  const [appointmentType, setAppointmentType] = useState('Consultation');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledAt) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/patient/book-appointment',
        {
          scheduledAt: new Date(scheduledAt).toISOString(),
          appointmentType,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      navigate('/patient/patient-dashboard');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Booking failed');
      } else {
        setError('Booking failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white shadow-sm rounded-lg p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-2">Book appointment</h1>
      <p className="text-sm text-gray-500 mb-6">Request a visit with your practice.</p>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date & time</label>
          <input
            type="datetime-local"
            required
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={appointmentType}
            onChange={(e) => setAppointmentType(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          >
            <option>Consultation</option>
            <option>Follow-up</option>
            <option>Check-up</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-cyan-600 text-white rounded-md text-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm booking'}
          </button>
          <Link to="/patient/patient-dashboard" className="px-4 py-2 border rounded-md text-sm text-gray-700">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default BookAppointment;
