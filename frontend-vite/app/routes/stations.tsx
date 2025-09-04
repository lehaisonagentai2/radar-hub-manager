import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import { stationsAPI } from '../lib/api';
import { useStationStore, useAuthStore } from '../lib/store';
import { hasPermission, cn } from '../lib/utils';
import toast from 'react-hot-toast';

export function meta() {
  return [
    { title: "Quản lý trạm - Radar Hub Manager" },
    { name: "description", content: "Quản lý thông tin các trạm radar" },
  ];
}

interface StationFormData {
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  distance_to_coast?: number;
  status: string;
  note?: string;
}

export default function Stations() {
  const { user } = useAuthStore();
  const { stations, setStations } = useStationStore();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StationFormData>();

  useEffect(() => {
    if (!user) return;
    if (!hasPermission(user.role_id, ['ADMIN'])) {
      toast.error('Bạn không có quyền truy cập trang này');
      return;
    }
    loadStations();
  }, [user]);

  const loadStations = async () => {
    try {
      setLoading(true);
      const response = await stationsAPI.getAll();
      setStations(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi khi tải danh sách trạm');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (station?: any) => {
    setEditingStation(station);
    if (station) {
      reset({
        name: station.name,
        latitude: station.latitude,
        longitude: station.longitude,
        elevation: station.elevation,
        distance_to_coast: station.distance_to_coast,
        status: station.status,
        note: station.note,
      });
    } else {
      reset({
        name: '',
        latitude: 0,
        longitude: 0,
        status: 'active',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStation(null);
    reset();
  };

  const onSubmit = async (data: StationFormData) => {
    setSubmitting(true);
    try {
      if (editingStation) {
        await stationsAPI.update(editingStation.id, data);
        toast.success('Cập nhật trạm thành công');
      } else {
        await stationsAPI.create(data);
        toast.success('Tạo trạm thành công');
      }
      handleCloseModal();
      loadStations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi khi lưu trạm');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (station: any) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa trạm "${station.name}"?`)) {
      return;
    }

    try {
      await stationsAPI.delete(station.id);
      toast.success('Xóa trạm thành công');
      loadStations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi khi xóa trạm');
    }
  };

  if (!user || !hasPermission(user.role_id, ['ADMIN'])) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Bạn không có quyền truy cập trang này</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý trạm radar</h1>
              <p className="mt-1 text-sm text-gray-500">
                Quản lý thông tin các trạm radar trong hệ thống
              </p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Thêm trạm mới
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {stations.map((station) => (
                  <li key={station.id}>
                    <div className="px-4 py-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            {station.name}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className={cn(
                              'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                              station.status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            )}>
                              {station.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex">
                          <div className="flex items-center text-sm text-gray-500">
                            <p>
                              Vị trí: {station.latitude}, {station.longitude}
                              {station.elevation && ` | Độ cao: ${station.elevation}m`}
                              {station.distance_to_coast && ` | Khoảng cách bờ biển: ${station.distance_to_coast}km`}
                            </p>
                          </div>
                        </div>
                        {station.note && (
                          <div className="mt-1">
                            <p className="text-sm text-gray-500">{station.note}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenModal(station)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(station)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {stations.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Chưa có trạm nào được tạo</p>
                </div>
              )}
            </div>
          )}

          {/* Station Form Modal */}
          <Transition appear show={isModalOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleCloseModal}>
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black bg-opacity-25" />
              </Transition.Child>

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <Dialog.Title
                          as="h3"
                          className="text-lg font-medium leading-6 text-gray-900"
                        >
                          {editingStation ? 'Chỉnh sửa trạm' : 'Thêm trạm mới'}
                        </Dialog.Title>
                        <button
                          onClick={handleCloseModal}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>

                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Tên trạm *
                          </label>
                          <input
                            {...register('name', { required: 'Vui lòng nhập tên trạm' })}
                            type="text"
                            className={cn(
                              'mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
                              errors.name && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                            )}
                          />
                          {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Vĩ độ *
                            </label>
                            <input
                              {...register('latitude', { 
                                required: 'Vui lòng nhập vĩ độ',
                                valueAsNumber: true 
                              })}
                              type="number"
                              step="0.000001"
                              className={cn(
                                'mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
                                errors.latitude && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                              )}
                            />
                            {errors.latitude && (
                              <p className="mt-1 text-sm text-red-600">{errors.latitude.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Kinh độ *
                            </label>
                            <input
                              {...register('longitude', { 
                                required: 'Vui lòng nhập kinh độ',
                                valueAsNumber: true 
                              })}
                              type="number"
                              step="0.000001"
                              className={cn(
                                'mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
                                errors.longitude && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                              )}
                            />
                            {errors.longitude && (
                              <p className="mt-1 text-sm text-red-600">{errors.longitude.message}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Độ cao (m)
                            </label>
                            <input
                              {...register('elevation', { valueAsNumber: true })}
                              type="number"
                              step="0.1"
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Khoảng cách bờ biển (km)
                            </label>
                            <input
                              {...register('distance_to_coast', { valueAsNumber: true })}
                              type="number"
                              step="0.1"
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Trạng thái
                          </label>
                          <select
                            {...register('status')}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="active">Hoạt động</option>
                            <option value="inactive">Không hoạt động</option>
                            <option value="maintenance">Bảo trì</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Ghi chú
                          </label>
                          <textarea
                            {...register('note')}
                            rows={3}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                          <button
                            type="button"
                            onClick={handleCloseModal}
                            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            disabled={submitting}
                            className={cn(
                              'inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                              submitting && 'opacity-50 cursor-not-allowed'
                            )}
                          >
                            {submitting ? 'Đang lưu...' : editingStation ? 'Cập nhật' : 'Tạo mới'}
                          </button>
                        </div>
                      </form>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>
        </div>
      </div>
    </Layout>
  );
}
