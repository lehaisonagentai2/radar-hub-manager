import { useState, useEffect } from 'react';
import { stationsAPI, schedulesAPI } from '../lib/api';
import { useStationStore } from '../lib/store';
import { isStationActiveAtHour } from '../lib/utils';
import { cn } from '../lib/utils';

interface ShiftGridProps {
  onCellClick: (station: any, hour: number, schedules: any[]) => void;
}

export default function ShiftGrid({ onCellClick }: ShiftGridProps) {
  const { stations, setStations } = useStationStore();
  const [schedules, setSchedules] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load stations
      const stationsResponse = await stationsAPI.getAll();
      const stationsData = stationsResponse.data;
      setStations(stationsData);

      // Load schedules for each station
      const schedulesData: Record<number, any[]> = {};
      await Promise.all(
        stationsData.map(async (station: any) => {
          try {
            const scheduleResponse = await schedulesAPI.getByStation(station.id);
            schedulesData[station.id] = scheduleResponse.data;
          } catch (error) {
            schedulesData[station.id] = [];
          }
        })
      );
      setSchedules(schedulesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Lịch trực 24h - {new Date().toLocaleDateString('vi-VN')}
        </h2>
        
        <div className="overflow-x-auto">
          <div className="grid grid-cols-25 gap-1 min-w-max">
            {/* Header */}
            <div className="text-xs font-medium text-gray-500 p-2 border-b">
              Trạm
            </div>
            {hours.map((hour) => (
              <div
                key={hour}
                className="text-xs font-medium text-gray-500 p-2 border-b text-center min-w-[40px]"
              >
                {hour.toString().padStart(2, '0')}
              </div>
            ))}

            {/* Station rows */}
            {stations.map((station) => (
              <div key={station.id} className="contents">
                <div className="text-sm font-medium p-2 bg-gray-50 border-r truncate min-w-[120px]">
                  {station.name}
                </div>
                {hours.map((hour) => {
                  const stationSchedules = schedules[station.id] || [];
                  const { isActive, fillRatio } = isStationActiveAtHour(stationSchedules, hour);
                  
                  return (
                    <div
                      key={`${station.id}-${hour}`}
                      className={cn(
                        'min-h-[40px] border border-gray-200 cursor-pointer transition-colors hover:border-blue-300',
                        isActive ? 'bg-green-500' : 'bg-gray-100'
                      )}
                      style={
                        isActive
                          ? {
                              background: `linear-gradient(to right, #10b981 ${fillRatio * 100}%, #f3f4f6 ${fillRatio * 100}%)`,
                            }
                          : {}
                      }
                      onClick={() => isActive && onCellClick(station, hour, stationSchedules)}
                      title={
                        isActive
                          ? `${station.name} - ${hour}:00 (${Math.round(fillRatio * 100)}% hoạt động)`
                          : `${station.name} - ${hour}:00 (Không hoạt động)`
                      }
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span>Hoạt động</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-100 border rounded mr-2"></div>
              <span>Không hoạt động</span>
            </div>
          </div>
          
          <button
            onClick={loadData}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
          >
            Làm mới
          </button>
        </div>
      </div>
    </div>
  );
}
