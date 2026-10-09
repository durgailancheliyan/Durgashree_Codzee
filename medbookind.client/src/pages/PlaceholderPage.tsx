import React from 'react';
import { useLocation } from 'react-router-dom';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  const location = useLocation();
  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-sm border border-slate-200">
      <h1 className="text-2xl font-semibold text-slate-800 mb-2">{title}</h1>
      <p className="text-slate-600 mb-4">
        {description ?? 'This screen is wired in the router; implement UI and API integration as needed.'}
      </p>
      <p className="text-sm font-mono text-slate-500 bg-slate-50 px-3 py-2 rounded">{location.pathname}</p>
    </div>
  );
};

export default PlaceholderPage;
