import React from 'react';

const DeveloperDashboard: React.FC = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Developer Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-2">API Status</h2>
                    <p className="text-gray-600">Monitor API endpoints</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-2">Logs</h2>
                    <p className="text-gray-600">View system logs</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-2">Settings</h2>
                    <p className="text-gray-600">System configuration</p>
                </div>
            </div>
        </div>
    );
};

export default DeveloperDashboard; 