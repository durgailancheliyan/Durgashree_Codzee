import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { usePracticeId } from '@/hooks/usePracticeId';

interface ConfigurationShellProps {
  title: string;
  description: string;
  children: (practiceId: string) => React.ReactNode;
}

const ConfigurationShell: React.FC<ConfigurationShellProps> = ({ title, description, children }) => {
  const { practiceId, loading } = usePracticeId();

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (!practiceId) {
    return (
      <div className="max-w-3xl mx-auto p-6 rounded-lg border border-amber-200 bg-amber-50 text-amber-900">
        <p className="font-medium">Practice not configured</p>
        <p className="text-sm mt-2">Complete onboarding before using configuration modules.</p>
        <Link to="/onboarding" className="text-sm text-cyan-700 underline mt-2 inline-block">
          Go to onboarding
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        <Link to="/admin/configuration/treatment" className="text-cyan-600 hover:underline">
          Treatment
        </Link>
        <span className="text-gray-300">|</span>
        <Link to="/admin/configuration/patient" className="text-cyan-600 hover:underline">
          Patient
        </Link>
        <span className="text-gray-300">|</span>
        <Link to="/admin/configuration/payment" className="text-cyan-600 hover:underline">
          Payment
        </Link>
        <span className="text-gray-300">|</span>
        <Link to="/admin/configuration/appointment" className="text-cyan-600 hover:underline">
          Appointment
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="text-gray-500 mt-1 mb-6">{description}</p>
      {children(practiceId)}
    </div>
  );
};

export default ConfigurationShell;
