import { useState, useEffect } from 'react';
import { useAuthStore, useWebSocketStore } from '../lib/store';
import { hasPermission } from '../lib/utils';
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

  useEffect(() => {
    // Connect to WebSocket when component mounts
    if (token) {
      connect(token);
    }
  }, [token, connect]);

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

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
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
                          {/* This would be populated from store */}
                          --
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
                          --
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
                          Cảnh báo
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          0
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
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
