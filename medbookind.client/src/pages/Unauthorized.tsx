import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_DESCRIPTIONS, type AppRole } from '@/utils/rbac';

const Unauthorized: React.FC = () => {
    const { user } = useAuth();
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-md">
                    <div className="flex justify-center">
                        <div className="rounded-full bg-cyan-100 p-3">
                            <ShieldAlert className="h-6 w-6 text-cyan-600" />
                        </div>
                    </div>
                    <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Access Denied</h1>
                    <p className="mt-4 text-lg text-gray-600">You don't have permission to access this page.</p>
                    {user?.role && (
                      <p className="mt-2 text-sm text-gray-500">
                        Your role ({user.role}): {ROLE_DESCRIPTIONS[user.role as AppRole] ?? 'Limited access'}
                      </p>
                    )}
                    <div className="mt-8">
                        <Link
                            to="/"
                            className="inline-flex items-center px-4 py-2.5 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 transform hover:scale-[1.02]"
                        >
                            <Home className="h-5 w-5 mr-2" />
                            Return to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized; 