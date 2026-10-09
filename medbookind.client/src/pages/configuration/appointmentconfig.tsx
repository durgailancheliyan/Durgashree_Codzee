import React, { useEffect, useState } from 'react';
import ConfigurationShell from '@/components/config/ConfigurationShell';
import {
  fetchPracticeConfigs,
  saveAppointmentConfig,
  type AppointmentConfigData,
} from '@/services/practiceConfig.service';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const AppointmentConfigPage: React.FC = () => (
  <ConfigurationShell
    title="Appointment configuration"
    description="Time slots, booking rules, cancellation policy, and notifications."
  >
    {(practiceId) => <AppointmentConfigEditor practiceId={practiceId} />}
  </ConfigurationShell>
);

const AppointmentConfigEditor: React.FC<{ practiceId: string }> = ({ practiceId }) => {
  const [config, setConfig] = useState<AppointmentConfigData | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPracticeConfigs(practiceId).then((d) => setConfig(d.appointmentConfig));
  }, [practiceId]);

  if (!config) return <p className="text-gray-500">Loading...</p>;

  const toggleDay = (day: number) => {
    const days = config.timeSlots.workingDays.includes(day)
      ? config.timeSlots.workingDays.filter((d) => d !== day)
      : [...config.timeSlots.workingDays, day].sort();
    setConfig({
      ...config,
      timeSlots: { ...config.timeSlots, workingDays: days },
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAppointmentConfig(practiceId, config);
      setMessage('Saved successfully.');
    } catch {
      setMessage('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-lg border p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Time slots</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-600">Start time</label>
            <input
              type="time"
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              value={config.timeSlots.startTime}
              onChange={(e) =>
                setConfig({
                  ...config,
                  timeSlots: { ...config.timeSlots, startTime: e.target.value },
                })
              }
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">End time</label>
            <input
              type="time"
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              value={config.timeSlots.endTime}
              onChange={(e) =>
                setConfig({
                  ...config,
                  timeSlots: { ...config.timeSlots, endTime: e.target.value },
                })
              }
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Interval (minutes)</label>
            <input
              type="number"
              min={15}
              step={15}
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              value={config.timeSlots.intervalMinutes}
              onChange={(e) =>
                setConfig({
                  ...config,
                  timeSlots: {
                    ...config.timeSlots,
                    intervalMinutes: Number(e.target.value),
                  },
                })
              }
            />
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4 mb-2">Working days</p>
        <div className="flex flex-wrap gap-2">
          {DAY_LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => toggleDay(i)}
              className={`px-3 py-1 rounded-full text-sm border ${
                config.timeSlots.workingDays.includes(i)
                  ? 'bg-cyan-600 text-white border-cyan-600'
                  : 'bg-white text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-lg border p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Booking rules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Max advance booking (days)</label>
            <input
              type="number"
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              value={Number(config.bookingRules.maxAdvanceDays)}
              onChange={(e) =>
                setConfig({
                  ...config,
                  bookingRules: {
                    ...config.bookingRules,
                    maxAdvanceDays: Number(e.target.value),
                  },
                })
              }
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Min notice (hours)</label>
            <input
              type="number"
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              value={Number(config.bookingRules.minNoticeHours)}
              onChange={(e) =>
                setConfig({
                  ...config,
                  bookingRules: {
                    ...config.bookingRules,
                    minNoticeHours: Number(e.target.value),
                  },
                })
              }
            />
          </div>
          <label className="flex items-center gap-2 text-sm col-span-2">
            <input
              type="checkbox"
              checked={!!config.bookingRules.allowSameDayBooking}
              onChange={() =>
                setConfig({
                  ...config,
                  bookingRules: {
                    ...config.bookingRules,
                    allowSameDayBooking: !config.bookingRules.allowSameDayBooking,
                  },
                })
              }
            />
            Allow same-day booking
          </label>
        </div>
      </section>

      <section className="bg-white rounded-lg border p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Cancellation policy</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!config.cancellationPolicy.allowCancellation}
              onChange={() =>
                setConfig({
                  ...config,
                  cancellationPolicy: {
                    ...config.cancellationPolicy,
                    allowCancellation: !config.cancellationPolicy.allowCancellation,
                  },
                })
              }
            />
            Allow cancellation
          </label>
          <div>
            <label className="text-sm text-gray-600">Min hours before appointment</label>
            <input
              type="number"
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              value={Number(config.cancellationPolicy.minHoursBefore)}
              onChange={(e) =>
                setConfig({
                  ...config,
                  cancellationPolicy: {
                    ...config.cancellationPolicy,
                    minHoursBefore: Number(e.target.value),
                  },
                })
              }
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Cancellation fee (%)</label>
            <input
              type="number"
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              value={Number(config.cancellationPolicy.cancellationFeePercent)}
              onChange={(e) =>
                setConfig({
                  ...config,
                  cancellationPolicy: {
                    ...config.cancellationPolicy,
                    cancellationFeePercent: Number(e.target.value),
                  },
                })
              }
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">No-show fee (INR)</label>
            <input
              type="number"
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              value={Number(config.cancellationPolicy.noShowFeeInr)}
              onChange={(e) =>
                setConfig({
                  ...config,
                  cancellationPolicy: {
                    ...config.cancellationPolicy,
                    noShowFeeInr: Number(e.target.value),
                  },
                })
              }
            />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg border p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Notifications</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            ['emailReminders', 'Email reminders'],
            ['smsReminders', 'SMS reminders'],
            ['notifyOnBooking', 'Notify on new booking'],
            ['notifyOnCancel', 'Notify on cancellation'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!config.notifications[key]}
                onChange={() =>
                  setConfig({
                    ...config,
                    notifications: {
                      ...config.notifications,
                      [key]: !config.notifications[key],
                    },
                  })
                }
              />
              {label}
            </label>
          ))}
          <div className="sm:col-span-2">
            <label className="text-sm text-gray-600">Reminder hours before</label>
            <input
              type="number"
              className="mt-1 w-full max-w-xs border rounded px-3 py-2 text-sm"
              value={Number(config.notifications.reminderHoursBefore)}
              onChange={(e) =>
                setConfig({
                  ...config,
                  notifications: {
                    ...config.notifications,
                    reminderHoursBefore: Number(e.target.value),
                  },
                })
              }
            />
          </div>
        </div>
      </section>

      {message && <p className="text-sm text-green-700">{message}</p>}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2.5 bg-cyan-600 text-white rounded-lg font-medium"
      >
        {saving ? 'Saving...' : 'Save appointment configuration'}
      </button>
    </div>
  );
};

export default AppointmentConfigPage;
