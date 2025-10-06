import { useState, useEffect } from 'react';
import { useAuthStore, useWebSocketStore } from '../lib/store';
import { hasPermission, getStationStats } from '../lib/utils';
import { stationsAPI, schedulesAPI } from '../lib/api';
import Layout from '../components/Layout';
import StatusBar from '../components/StatusBar';
import ShiftGrid from '../components/ShiftGrid';
import StationDetailModal from '../components/StationDetailModal';
import SendAlertModal from '../components/SendAlertModal';
import NotificationModal from '../components/NotificationModal';
import { SpeakerWaveIcon } from '@heroicons/react/24/outline';

export function meta() {
  return [
    { title: "Dashboard - Radar Hub Manager" },
    { name: "description", content: "Bảng điều khiển quản lý trạm radar" },
  ];
}

export default function Dashboard() {
  const { user, token } = useAuthStore();
  const { connect } = useWebSocketStore();
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [selectedHour, setSelectedHour] = useState<number>(0);
  const [selectedSchedules, setSelectedSchedules] = useState<any[]>([]);
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  
  // Station statistics state
  const [stationStats, setStationStats] = useState({
    totalStations: 0,
    activeStations: 0,
    inactiveStations: 0,
    loading: true
  });

  useEffect(() => {
    // Connect to WebSocket when component mounts
    if (token) {
      connect(token);
    }
  }, [token, connect]);

  useEffect(() => {
    // Load station statistics
    loadStationStats();
    
    // Refresh statistics every 30 seconds
    const interval = setInterval(loadStationStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStationStats = async () => {
    try {
      console.log('🔄 Loading station statistics...');
      const stats = await getStationStats();
      setStationStats({
        totalStations: stats.totalStations,
        activeStations: stats.activeStations,
        inactiveStations: stats.inactiveStations,
        loading: false
      });
      console.log('✅ Station statistics loaded:', stats);
    } catch (error) {
      console.error('❌ Failed to load station statistics:', error);
      setStationStats(prev => ({ ...prev, loading: false }));
    }
  };

  const handleCellClick = (station: any, hour: number, schedules: any[]) => {
    setSelectedStation(station);
    setSelectedHour(hour);
    setSelectedSchedules(schedules);
    setIsStationModalOpen(true);
  };

  const canSendAlerts = user && hasPermission(user.role_id, ['ADMIN', 'HQ']);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <StatusBar />
        
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Tổng quan hệ thống
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Bảng điều khiển quản lý trạm radar
                </p>
              </div>
              
              {canSendAlerts && (
                <button
                  onClick={() => setIsAlertModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <SpeakerWaveIcon className="h-4 w-4 mr-2" />
                  Gửi thông báo/lệnh
                </button>
              )}
            </div>

            <ShiftGrid onCellClick={handleCellClick} />

            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Quick Stats */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">📡</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Tổng số trạm
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stationStats.loading ? (
                            <div className="animate-pulse">
                              <div className="h-6 bg-gray-200 rounded w-8"></div>
                            </div>
                          ) : (
                            stationStats.totalStations
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">✓</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Trạm hoạt động
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stationStats.loading ? (
                            <div className="animate-pulse">
                              <div className="h-6 bg-gray-200 rounded w-8"></div>
                            </div>
                          ) : (
                            <span className="text-green-600 font-bold">
                              {stationStats.activeStations}
                            </span>
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">○</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Trạm không hoạt động
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stationStats.loading ? (
                            <div className="animate-pulse">
                              <div className="h-6 bg-gray-200 rounded w-8"></div>
                            </div>
                          ) : (
                            <span className="text-gray-600 font-bold">
                              {stationStats.inactiveStations}
                            </span>
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-medium">⚠</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Tỷ lệ hoạt động
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stationStats.loading ? (
                            <div className="animate-pulse">
                              <div className="h-6 bg-gray-200 rounded w-12"></div>
                            </div>
                          ) : (
                            <span className={`font-bold ${
                              stationStats.totalStations === 0 ? 'text-gray-500' :
                              (stationStats.activeStations / stationStats.totalStations) >= 0.8 ? 'text-green-600' :
                              (stationStats.activeStations / stationStats.totalStations) >= 0.5 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {stationStats.totalStations === 0 
                                ? '0%' 
                                : `${Math.round((stationStats.activeStations / stationStats.totalStations) * 100)}%`
                              }
                            </span>
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Update Indicator */}
            <div className="mt-4 flex justify-end">
              <div className="text-xs text-gray-500 flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${stationStats.loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                {stationStats.loading ? 'Đang cập nhật...' : `Cập nhật lúc ${new Date().toLocaleTimeString('vi-VN')}`}
              </div>
            </div>

            {user?.role_id === 'OPERATOR' && (
              <div className="mt-8">
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Thông tin trạm được phân công
                    </h3>
                    {user.station ? (
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium">Tên trạm:</span> {user.station.name}
                        </div>
                        <div>
                          <span className="font-medium">Vị trí:</span> {user.station.latitude}, {user.station.longitude}
                        </div>
                        <div>
                          <span className="font-medium">Trạng thái:</span> 
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {user.station.status || 'Hoạt động'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">Chưa được phân công trạm nào</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <StationDetailModal
          isOpen={isStationModalOpen}
          onClose={() => setIsStationModalOpen(false)}
          station={selectedStation}
          hour={selectedHour}
          schedules={selectedSchedules}
        />

        <SendAlertModal
          isOpen={isAlertModalOpen}
          onClose={() => setIsAlertModalOpen(false)}
        />

        <NotificationModal />
      </div>
    </Layout>
  );
}
