import { useState, useEffect } from 'react';
import { useWebSocketStore, useStationStore } from '../lib/store';
import { stationsAPI, schedulesAPI } from '../lib/api';
import { getActiveStationCount } from '../lib/utils';
import { WifiIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function StatusBar() {
  const { isConnected } = useWebSocketStore();
  const { stations } = useStationStore();
  const [onlineStations, setOnlineStations] = useState(0);
  const [activeStations, setActiveStations] = useState(0);
  const [allSchedules, setAllSchedules] = useState<Record<number, any[]>>({});

  useEffect(() => {
    loadSchedules();
    const interval = setInterval(updateActiveStations, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [stations]);

  useEffect(() => {
    updateActiveStations();
  }, [allSchedules, stations]);

  const loadSchedules = async () => {
    if (stations.length === 0) return;

    try {
      const schedulesData: Record<number, any[]> = {};
      await Promise.all(
        stations.map(async (station: any) => {
          try {
            const response = await schedulesAPI.getByStation(station.id);
            schedulesData[station.id] = response.data;
          } catch (error) {
            schedulesData[station.id] = [];
          }
        })
      );
      setAllSchedules(schedulesData);
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const updateActiveStations = () => {
    const activeCount = getActiveStationCount(stations, allSchedules);
    setActiveStations(activeCount);
    
    // Simulate online stations (in real app, this would come from WebSocket)
    setOnlineStations(Math.min(stations.length, activeCount + Math.floor(Math.random() * 2)));
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <WifiIcon className={`h-5 w-5 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
            <span className="text-sm font-medium text-gray-900">
              Kết nối WebSocket
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isConnected ? 'Đã kết nối' : 'Mất kết nối'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-900">
              Trạm online
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {onlineStations}/{stations.length}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <ClockIcon className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-gray-900">
              Trạm đang trực
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {activeStations}/{stations.length}
            </span>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Cập nhật lúc: {new Date().toLocaleTimeString('vi-VN')}
        </div>
      </div>
    </div>
  );
}
