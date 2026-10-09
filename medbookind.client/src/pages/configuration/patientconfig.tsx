import React, { useEffect, useState } from 'react';
import ConfigurationShell from '@/components/config/ConfigurationShell';
import {
  fetchPracticeConfigs,
  savePatientConfig,
  type PatientConfigData,
} from '@/services/practiceConfig.service';

const PatientConfigPage: React.FC = () => (
  <ConfigurationShell
    title="Patient configuration"
    description="Custom fields, validation rules, and form controls for new patient registration."
  >
    {(practiceId) => <PatientConfigEditor practiceId={practiceId} />}
  </ConfigurationShell>
);

const PatientConfigEditor: React.FC<{ practiceId: string }> = ({ practiceId }) => {
  const [config, setConfig] = useState<PatientConfigData | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPracticeConfigs(practiceId).then((d) => setConfig(d.patientConfig));
  }, [practiceId]);

  if (!config) return <p className="text-gray-500">Loading...</p>;

  const toggleField = (key: string, field: 'enabled' | 'required') => {
    setConfig((c) =>
      c
        ? {
            ...c,
            customFields: c.customFields.map((f) =>
              f.key === key ? { ...f, [field]: !f[field] } : f
            ),
          }
        : c
    );
  };

  const toggleRule = (key: string) => {
    setConfig((c) =>
      c
        ? {
            ...c,
            validationRules: {
              ...c.validationRules,
              [key]: !c.validationRules[key],
            },
          }
        : c
    );
  };

  const toggleControl = (key: string) => {
    setConfig((c) =>
      c
        ? {
            ...c,
            formControl: { ...c.formControl, [key]: !c.formControl[key] },
          }
        : c
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await savePatientConfig(practiceId, config);
      setMessage('Saved successfully.');
    } catch {
      setMessage('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Custom fields</h2>
        <div className="space-y-3">
          {config.customFields.map((f) => (
            <div key={f.key} className="flex flex-wrap items-center gap-4 p-3 border rounded-lg">
              <span className="font-medium text-gray-800 w-32">{f.label}</span>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={f.enabled}
                  onChange={() => toggleField(f.key, 'enabled')}
                />
                Enabled
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={f.required}
                  disabled={!f.enabled}
                  onChange={() => toggleField(f.key, 'required')}
                />
                Required
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Validation rules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            ['requireEmail', 'Require email'],
            ['requirePhone', 'Require phone'],
            ['requireAddress', 'Require full address'],
            ['requireEmergencyContact', 'Require emergency contact'],
            ['requireInsurance', 'Require insurance'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={!!config.validationRules[key]}
                onChange={() => toggleRule(key)}
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
        <div className="mt-4">
          <label className="text-sm font-medium text-gray-700">PIN / postal pattern (regex)</label>
          <input
            className="mt-1 w-full max-w-md border rounded px-3 py-2 text-sm font-mono"
            value={String(config.validationRules.pincodePattern ?? '^\\d{6}$')}
            onChange={(e) =>
              setConfig((c) =>
                c ? { ...c, validationRules: { ...c.validationRules, pincodePattern: e.target.value } } : c
              )
            }
          />
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Form control</h2>
        <div className="flex flex-wrap gap-4">
          {[
            ['multiStepForm', 'Multi-step registration form'],
            ['showMiddleName', 'Show middle name field'],
            ['showDocuments', 'Allow document uploads'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!config.formControl[key]}
                onChange={() => toggleControl(key)}
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      {message && <p className="text-sm text-green-700">{message}</p>}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2.5 bg-cyan-600 text-white rounded-lg font-medium disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save patient configuration'}
      </button>
    </div>
  );
};

export default PatientConfigPage;
