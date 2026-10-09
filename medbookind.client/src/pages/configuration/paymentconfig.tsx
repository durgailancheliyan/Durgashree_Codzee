import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import ConfigurationShell from '@/components/config/ConfigurationShell';
import {
  fetchPracticeConfigs,
  savePaymentConfig,
  type PaymentConfigData,
} from '@/services/practiceConfig.service';

const PaymentConfigPage: React.FC = () => (
  <ConfigurationShell
    title="Payment configuration"
    description="Payment methods, fee setup, and discounts for your practice."
  >
    {(practiceId) => <PaymentConfigEditor practiceId={practiceId} />}
  </ConfigurationShell>
);

const PaymentConfigEditor: React.FC<{ practiceId: string }> = ({ practiceId }) => {
  const [config, setConfig] = useState<PaymentConfigData | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPracticeConfigs(practiceId).then((d) => setConfig(d.paymentConfig));
  }, [practiceId]);

  if (!config) return <p className="text-gray-500">Loading...</p>;

  const handleSave = async () => {
    setSaving(true);
    try {
      await savePaymentConfig(practiceId, config);
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
        <h2 className="text-lg font-semibold mb-4">Payment methods</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {config.paymentMethods.map((m, i) => (
            <label key={m.id} className="flex items-center gap-2 p-3 border rounded-lg">
              <input
                type="checkbox"
                checked={m.enabled}
                onChange={() => {
                  const next = [...config.paymentMethods];
                  next[i] = { ...m, enabled: !m.enabled };
                  setConfig({ ...config, paymentMethods: next });
                }}
              />
              <span className="text-sm font-medium">{m.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-lg border p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Fee setup (INR)</h2>
          <button
            type="button"
            className="text-sm text-cyan-600 flex items-center gap-1"
            onClick={() =>
              setConfig({
                ...config,
                fees: [...config.fees, { id: `fee-${Date.now()}`, name: 'New fee', amountInr: 0 }],
              })
            }
          >
            <Plus className="h-4 w-4" /> Add fee
          </button>
        </div>
        <div className="space-y-2">
          {config.fees.map((fee, i) => (
            <div key={fee.id} className="flex gap-2 items-center">
              <input
                className="flex-1 border rounded px-3 py-2 text-sm"
                value={fee.name}
                onChange={(e) => {
                  const fees = [...config.fees];
                  fees[i] = { ...fee, name: e.target.value };
                  setConfig({ ...config, fees });
                }}
              />
              <input
                type="number"
                className="w-28 border rounded px-3 py-2 text-sm"
                value={fee.amountInr}
                onChange={(e) => {
                  const fees = [...config.fees];
                  fees[i] = { ...fee, amountInr: Number(e.target.value) };
                  setConfig({ ...config, fees });
                }}
              />
              <button
                type="button"
                onClick={() =>
                  setConfig({ ...config, fees: config.fees.filter((_, j) => j !== i) })
                }
                className="p-2 text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-lg border p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Discounts</h2>
          <button
            type="button"
            className="text-sm text-cyan-600 flex items-center gap-1"
            onClick={() =>
              setConfig({
                ...config,
                discounts: [
                  ...config.discounts,
                  { id: `d-${Date.now()}`, name: 'New discount', type: 'percent', value: 5 },
                ],
              })
            }
          >
            <Plus className="h-4 w-4" /> Add discount
          </button>
        </div>
        <div className="space-y-2">
          {config.discounts.map((d, i) => (
            <div key={d.id} className="flex gap-2 items-center">
              <input
                className="flex-1 border rounded px-3 py-2 text-sm"
                value={d.name}
                onChange={(e) => {
                  const discounts = [...config.discounts];
                  discounts[i] = { ...d, name: e.target.value };
                  setConfig({ ...config, discounts });
                }}
              />
              <select
                className="border rounded px-2 py-2 text-sm"
                value={d.type}
                onChange={(e) => {
                  const discounts = [...config.discounts];
                  discounts[i] = { ...d, type: e.target.value };
                  setConfig({ ...config, discounts });
                }}
              >
                <option value="percent">%</option>
                <option value="fixed">INR</option>
              </select>
              <input
                type="number"
                className="w-20 border rounded px-2 py-2 text-sm"
                value={d.value}
                onChange={(e) => {
                  const discounts = [...config.discounts];
                  discounts[i] = { ...d, value: Number(e.target.value) };
                  setConfig({ ...config, discounts });
                }}
              />
              <button
                type="button"
                onClick={() =>
                  setConfig({ ...config, discounts: config.discounts.filter((_, j) => j !== i) })
                }
                className="p-2 text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {message && <p className="text-sm text-green-700">{message}</p>}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2.5 bg-cyan-600 text-white rounded-lg font-medium"
      >
        {saving ? 'Saving...' : 'Save payment configuration'}
      </button>
    </div>
  );
};

export default PaymentConfigPage;
