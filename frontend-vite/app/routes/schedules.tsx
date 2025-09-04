import { useState, useEffect } from 'react';
import { schedulesAPI, stationsAPI, type Schedule, type Station } from '../lib/api';
import { useAuthStore } from '../lib/store';
import Layout from '../components/Layout';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface ScheduleFormData {
  station_id: number;
  start_hhmm: string;
  end_hhmm: string;
  commander?: string;
  crew?: string;
  phone?: string;
}

interface ScheduleWithStation extends Schedule {
  station?: Station;
}

export default function Schedules() {
  const { user } = useAuthStore();
  const [schedules, setSchedules] = useState<ScheduleWithStation[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState<ScheduleFormData>({
    station_id: 0,
    start_hhmm: '',
    end_hhmm: '',
    commander: '',
    crew: '',
    phone: '',
  });

  // Check if user has permission to create/update schedules
  const canEditSchedules = user?.role_id === 'ADMIN' || user?.role_id === 'HQ';

  useEffect(() => {
    loadStations();
  }, []);

  useEffect(() => {
    if (selectedStation) {
      loadSchedules(selectedStation);
    }
  }, [selectedStation]);

  const loadStations = async () => {
    try {
      const response = await stationsAPI.getAll();
      setStations(response.data);
      if (response.data.length > 0) {
        setSelectedStation(response.data[0].id);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách trạm');
      console.error('Error loading stations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSchedules = async (stationId: number) => {
    try {
      setLoading(true);
      const response = await schedulesAPI.getByStation(stationId);
      const station = stations.find(s => s.id === stationId);
      const schedulesWithStation = response.data.map((schedule: Schedule) => ({
        ...schedule,
        station
      }));
      setSchedules(schedulesWithStation);
    } catch (error) {
      toast.error('Không thể tải lịch trực');
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canEditSchedules) {
      toast.error('Bạn không có quyền thực hiện hành động này');
      return;
    }

    // Validate time format and logic
    if (formData.start_hhmm >= formData.end_hhmm) {
      toast.error('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc');
      return;
    }

    try {
      const { station_id, ...scheduleData } = formData;
      
      if (editingSchedule) {
        // Update existing schedule
        await schedulesAPI.update(station_id, editingSchedule.id, scheduleData);
        toast.success('Cập nhật lịch trực thành công');
      } else {
        // Create new schedule
        await schedulesAPI.create(station_id, scheduleData);
        toast.success('Tạo lịch trực thành công');
      }
      
      setShowModal(false);
      setEditingSchedule(null);
      resetForm();
      if (selectedStation) {
        loadSchedules(selectedStation);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể lưu lịch trực');
    }
  };

  const handleEdit = (schedule: Schedule) => {
    if (!canEditSchedules) {
      toast.error('Bạn không có quyền chỉnh sửa lịch trực');
      return;
    }

    setEditingSchedule(schedule);
    setFormData({
      station_id: schedule.station_id,
      start_hhmm: schedule.start_hhmm,
      end_hhmm: schedule.end_hhmm,
      commander: schedule.commander || '',
      crew: schedule.crew || '',
      phone: schedule.phone || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (schedule: Schedule) => {
    if (!canEditSchedules) {
      toast.error('Bạn không có quyền xóa lịch trực');
      return;
    }

    if (!confirm('Bạn có chắc chắn muốn xóa lịch trực này không?')) return;
    
    try {
      await schedulesAPI.delete(schedule.station_id, schedule.id);
      toast.success('Xóa lịch trực thành công');
      if (selectedStation) {
        loadSchedules(selectedStation);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa lịch trực');
    }
  };

  const resetForm = () => {
    setFormData({
      station_id: selectedStation || 0,
      start_hhmm: '',
      end_hhmm: '',
      commander: '',
      crew: '',
      phone: '',
    });
  };

  const formatTime = (hhmm: string) => {
    return `${hhmm.slice(0, 2)}:${hhmm.slice(2, 4)}`;
  };

  if (loading && stations.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản Lý Lịch Trực</h1>
            <p className="text-gray-600">Quản lý lịch trực ca làm việc của các trạm radar</p>
          </div>
          {canEditSchedules && (
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Thêm Lịch Trực</span>
            </button>
          )}
        </div>

        {/* Station Filter */}
        <div className="bg-white p-4 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chọn Trạm
          </label>
          <select
            className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={selectedStation || ''}
            onChange={(e) => setSelectedStation(Number(e.target.value))}
          >
            <option value="">Chọn trạm...</option>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name}
              </option>
            ))}
          </select>
        </div>

        {/* Schedules Table */}
        {selectedStation && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Lịch Trực - {stations.find(s => s.id === selectedStation)?.name}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời Gian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chỉ Huy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thủy Thủ Đoàn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Điện Thoại
                    </th>
                    {canEditSchedules && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hành Động
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={canEditSchedules ? 5 : 4} className="px-6 py-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      </td>
                    </tr>
                  ) : schedules.length === 0 ? (
                    <tr>
                      <td colSpan={canEditSchedules ? 5 : 4} className="px-6 py-4 text-center text-gray-500">
                        Chưa có lịch trực nào được tạo
                      </td>
                    </tr>
                  ) : (
                    schedules.map((schedule) => (
                      <tr key={schedule.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <ClockIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {formatTime(schedule.start_hhmm)} - {formatTime(schedule.end_hhmm)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">
                              {schedule.commander || 'Chưa phân công'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {schedule.crew || 'Chưa phân công'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <PhoneIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">
                              {schedule.phone || 'Chưa có'}
                            </span>
                          </div>
                        </td>
                        {canEditSchedules && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(schedule)}
                                className="text-indigo-600 hover:text-indigo-900 p-1"
                                title="Chỉnh sửa"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(schedule)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Xóa"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Schedule Form Modal */}
        {showModal && canEditSchedules && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingSchedule ? 'Chỉnh Sửa Lịch Trực' : 'Thêm Lịch Trực Mới'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạm
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.station_id}
                      onChange={(e) => setFormData({ ...formData, station_id: Number(e.target.value) })}
                    >
                      <option value={0}>Chọn trạm...</option>
                      {stations.map((station) => (
                        <option key={station.id} value={station.id}>
                          {station.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giờ Bắt Đầu
                      </label>
                      <input
                        type="time"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        value={formData.start_hhmm ? `${formData.start_hhmm.slice(0,2)}:${formData.start_hhmm.slice(2,4)}` : ''}
                        onChange={(e) => {
                          const time = e.target.value.replace(':', '');
                          setFormData({ ...formData, start_hhmm: time });
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giờ Kết Thúc
                      </label>
                      <input
                        type="time"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        value={formData.end_hhmm ? `${formData.end_hhmm.slice(0,2)}:${formData.end_hhmm.slice(2,4)}` : ''}
                        onChange={(e) => {
                          const time = e.target.value.replace(':', '');
                          setFormData({ ...formData, end_hhmm: time });
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chỉ Huy
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.commander}
                      onChange={(e) => setFormData({ ...formData, commander: e.target.value })}
                      placeholder="Tên chỉ huy ca trực"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thủy Thủ Đoàn
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.crew}
                      onChange={(e) => setFormData({ ...formData, crew: e.target.value })}
                      placeholder="Danh sách thủy thủ đoàn"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số Điện Thoại
                    </label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Số điện thoại liên lạc"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingSchedule(null);
                        resetForm();
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-md hover:bg-gray-300"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                      {editingSchedule ? 'Cập Nhật' : 'Tạo Mới'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Access Denied Message */}
        {!canEditSchedules && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Quyền Truy Cập Hạn Chế
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Bạn chỉ có thể xem lịch trực. Chỉ có Quản Trị (ADMIN) và Trung Tâm (HQ) mới có quyền tạo và chỉnh sửa lịch trực.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
