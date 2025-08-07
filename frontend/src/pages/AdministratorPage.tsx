import React, { useState } from 'react';
import UserManager from '../components/UserManager';
import StationManager from '../components/StationManager';

const AdministratorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'stations'>('users');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Administrator Panel
          </h1>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-radar-500 text-radar-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User Management
              </button>
              <button
                onClick={() => setActiveTab('stations')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'stations'
                    ? 'border-radar-500 text-radar-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Station Management
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-white shadow rounded-lg">
            {activeTab === 'users' && <UserManager />}
            {activeTab === 'stations' && <StationManager />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdministratorPage;
