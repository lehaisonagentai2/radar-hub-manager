import React, { useState, useEffect } from 'react';
import { Station, Schedule, Command } from '../types/api';
import { apiClient } from '../services/api';
import ShiftGrid from '../components/ShiftGrid';
import CommandModal from '../components/CommandModal';

const HQPage: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showCommandModal, setShowCommandModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stationsData, schedulesData] = await Promise.all([
        apiClient.getStations(),
        apiClient.getSchedules()
      ]);
      setStations(stationsData);
      setSchedules(schedulesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCommand = (station: Station) => {
    setSelectedStation(station);
    setShowCommandModal(true);
  };

  const handleCommandSent = () => {
    setShowCommandModal(false);
    setSelectedStation(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              HQ Command Center
            </h1>
            <div className="flex space-x-4">
              <div className="bg-green-100 px-4 py-2 rounded-lg">
                <span className="text-green-800 font-medium">
                  Stations Online: {stations.filter(s => s.status === 'ACTIVE').length}
                </span>
              </div>
              <div className="bg-blue-100 px-4 py-2 rounded-lg">
                <span className="text-blue-800 font-medium">
                  Active Shifts: {schedules.length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                24-Hour Shift Grid
              </h2>
              <p className="text-gray-600">
                Green cells indicate active shifts. Click on a cell to view shift details.
              </p>
            </div>
            
            <ShiftGrid 
              stations={stations} 
              schedules={schedules}
              onSendCommand={handleSendCommand}
            />
          </div>
        </div>
      </div>

      {showCommandModal && selectedStation && (
        <CommandModal
          station={selectedStation}
          onClose={() => setShowCommandModal(false)}
          onCommandSent={handleCommandSent}
        />
      )}
    </div>
  );
};

export default HQPage;
