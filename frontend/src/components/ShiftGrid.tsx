import React, { useState } from 'react';
import { Station, Schedule } from '../types/api';

interface ShiftGridProps {
  stations: Station[];
  schedules: Schedule[];
  onSendCommand: (station: Station) => void;
}

interface ShiftInfo {
  commander?: string;
  crew?: string;
  phone?: string;
  start_hhmm: string;
  end_hhmm: string;
}

const ShiftGrid: React.FC<ShiftGridProps> = ({ stations, schedules, onSendCommand }) => {
  const [selectedCell, setSelectedCell] = useState<{station: Station, hour: number, shift?: ShiftInfo} | null>(null);

  // Generate hours 00-23
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

  // Helper function to check if a station is active during a specific hour
  const isStationActiveAtHour = (stationId: number, hour: number): ShiftInfo | null => {
    const stationSchedules = schedules.filter(s => s.station_id === stationId);
    
    for (const schedule of stationSchedules) {
      const startHour = parseInt(schedule.start_hhmm.substring(0, 2));
      const startMin = parseInt(schedule.start_hhmm.substring(2, 4));
      const endHour = parseInt(schedule.end_hhmm.substring(0, 2));
      const endMin = parseInt(schedule.end_hhmm.substring(2, 4));
      
      const startTime = startHour + startMin / 60;
      const endTime = endHour + endMin / 60;
      
      // Handle overnight shifts
      if (endTime < startTime) {
        if (hour >= startTime || hour < endTime) {
          return {
            commander: schedule.commander,
            crew: schedule.crew,
            phone: schedule.phone,
            start_hhmm: schedule.start_hhmm,
            end_hhmm: schedule.end_hhmm
          };
        }
      } else {
        if (hour >= startTime && hour < endTime) {
          return {
            commander: schedule.commander,
            crew: schedule.crew,
            phone: schedule.phone,
            start_hhmm: schedule.start_hhmm,
            end_hhmm: schedule.end_hhmm
          };
        }
      }
    }
    
    return null;
  };

  // Get cell style based on shift status
  const getCellStyle = (stationId: number, hour: number) => {
    const shift = isStationActiveAtHour(stationId, hour);
    if (shift) {
      return 'bg-green-200 hover:bg-green-300 cursor-pointer border border-green-300';
    }
    return 'bg-gray-100 hover:bg-gray-200 border border-gray-200';
  };

  const handleCellClick = (station: Station, hour: number) => {
    const shift = isStationActiveAtHour(station.id, hour);
    setSelectedCell({ station, hour, shift: shift || undefined });
  };

  const closeModal = () => {
    setSelectedCell(null);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="px-4 py-2 bg-gray-50 border border-gray-300 text-left text-sm font-medium text-gray-700">
              Station
            </th>
            {hours.map(hour => (
              <th key={hour} className="px-2 py-2 bg-gray-50 border border-gray-300 text-center text-xs font-medium text-gray-700">
                {hour}:00
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stations.map(station => (
            <tr key={station.id}>
              <td className="px-4 py-2 bg-gray-50 border border-gray-300 text-sm font-medium text-gray-900 whitespace-nowrap">
                <div className="flex justify-between items-center">
                  <span>{station.name}</span>
                  <button
                    onClick={() => onSendCommand(station)}
                    className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    title="Send Command"
                  >
                    CMD
                  </button>
                </div>
              </td>
              {hours.map((hour, hourIndex) => (
                <td
                  key={hour}
                  className={`h-12 w-16 border border-gray-300 ${getCellStyle(station.id, hourIndex)}`}
                  onClick={() => handleCellClick(station, hourIndex)}
                  title={isStationActiveAtHour(station.id, hourIndex) ? 'Active shift - click for details' : 'No active shift'}
                >
                  <div className="h-full w-full flex items-center justify-center">
                    {isStationActiveAtHour(station.id, hourIndex) && (
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    )}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Shift Details Modal */}
      {selectedCell && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {selectedCell.station.name} - {selectedCell.hour.toString().padStart(2, '0')}:00
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {selectedCell.shift ? (
              <div className="space-y-3">
                <div className="bg-green-50 p-3 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Active Shift</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Time:</span> {selectedCell.shift.start_hhmm.substring(0,2)}:{selectedCell.shift.start_hhmm.substring(2,4)} - {selectedCell.shift.end_hhmm.substring(0,2)}:{selectedCell.shift.end_hhmm.substring(2,4)}
                    </div>
                    {selectedCell.shift.commander && (
                      <div>
                        <span className="font-medium">Commander:</span> {selectedCell.shift.commander}
                      </div>
                    )}
                    {selectedCell.shift.crew && (
                      <div>
                        <span className="font-medium">Crew:</span> {selectedCell.shift.crew}
                      </div>
                    )}
                    {selectedCell.shift.phone && (
                      <div>
                        <span className="font-medium">Phone:</span> {selectedCell.shift.phone}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    onSendCommand(selectedCell.station);
                    closeModal();
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Send Command to Station
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-600">No active shift during this hour</p>
                </div>
                <button
                  onClick={() => {
                    onSendCommand(selectedCell.station);
                    closeModal();
                  }}
                  className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Send Command to Station
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftGrid;
