import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Command, Station } from '../types/api';
import { apiClient } from '../services/api';
import NotificationModal from '../components/NotificationModal';

const OperatorPage: React.FC = () => {
  const { user } = useAuth();
  const [station, setStation] = useState<Station | null>(null);
  const [commands, setCommands] = useState<Command[]>([]);
  const [unreadCommands, setUnreadCommands] = useState<Command[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.station) {
      setStation(user.station);
      loadCommands();
    }
  }, [user]);

  useEffect(() => {
    // Check for new commands every 30 seconds
    const interval = setInterval(() => {
      if (station) {
        loadCommands();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [station]);

  const loadCommands = async () => {
    if (!station) return;

    try {
      const commandsData = await apiClient.getCommands(station.id);
      const newUnreadCommands = commandsData.filter(cmd => !cmd.acknowledged_at);
      
      setCommands(commandsData);
      setUnreadCommands(newUnreadCommands);
      
      if (newUnreadCommands.length > 0) {
        setShowNotification(true);
      }
    } catch (error) {
      console.error('Failed to load commands:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeCommand = async (commandId: number) => {
    try {
      await apiClient.acknowledgeCommand(commandId);
      setCommands(prev => 
        prev.map(cmd => 
          cmd.id === commandId 
            ? { ...cmd, acknowledged_at: Date.now() }
            : cmd
        )
      );
      setUnreadCommands(prev => prev.filter(cmd => cmd.id !== commandId));
    } catch (error) {
      console.error('Failed to acknowledge command:', error);
    }
  };

  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!station) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">No station assigned to this operator</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Station Operator - {station.name}
            </h1>
            {unreadCommands.length > 0 && (
              <div className="bg-red-100 px-4 py-2 rounded-lg">
                <span className="text-red-800 font-medium">
                  {unreadCommands.length} New Command(s)
                </span>
              </div>
            )}
          </div>

          {/* Station Information */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Station Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Station Name</label>
                <p className="mt-1 text-sm text-gray-900">{station.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className={`mt-1 text-sm font-medium ${
                  station.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {station.status}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Latitude</label>
                <p className="mt-1 text-sm text-gray-900">{station.latitude}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Longitude</label>
                <p className="mt-1 text-sm text-gray-900">{station.longitude}</p>
              </div>
              {station.elevation && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Elevation (m)</label>
                  <p className="mt-1 text-sm text-gray-900">{station.elevation}</p>
                </div>
              )}
              {station.distance_to_coast && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Distance to Coast (km)</label>
                  <p className="mt-1 text-sm text-gray-900">{station.distance_to_coast}</p>
                </div>
              )}
            </div>
            {station.note && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <p className="mt-1 text-sm text-gray-900">{station.note}</p>
              </div>
            )}
          </div>

          {/* Commands History */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Commands History</h2>
            {commands.length === 0 ? (
              <p className="text-gray-500">No commands received yet.</p>
            ) : (
              <div className="space-y-4">
                {commands.map((command) => (
                  <div
                    key={command.id}
                    className={`border rounded-lg p-4 ${
                      command.acknowledged_at 
                        ? 'border-gray-200 bg-gray-50' 
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{command.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Received: {new Date(command.created_at * 1000).toLocaleString()}
                        </p>
                        {command.acknowledged_at && (
                          <p className="text-xs text-gray-500">
                            Acknowledged: {new Date(command.acknowledged_at * 1000).toLocaleString()}
                          </p>
                        )}
                      </div>
                      {!command.acknowledged_at && (
                        <button
                          onClick={() => handleAcknowledgeCommand(command.id)}
                          className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showNotification && unreadCommands.length > 0 && (
        <NotificationModal
          commands={unreadCommands}
          onClose={handleCloseNotification}
          onAcknowledge={handleAcknowledgeCommand}
        />
      )}
    </div>
  );
};

export default OperatorPage;
