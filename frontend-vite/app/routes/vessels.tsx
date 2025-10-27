import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  XMarkIcon,
  MagnifyingGlassIcon,
  MapIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import { vesselsAPI } from '../lib/api';
import { useAuthStore } from '../lib/store';
import { hasPermission, cn, formatTime } from '../lib/utils';
import toast from 'react-hot-toast';

export function meta() {
  return [
    { title: "Quản lý tàu thuyền - Radar Hub Manager" },
    { name: "description", content: "Quản lý thông tin tàu thuyền trong hệ thống radar" },
  ];
}

interface VesselFormData {
  name: string;
  mmsi: string;
  vessel_type?: string;
  length?: number;
  width?: number;
  draft?: number;
  gross_tonnage?: number;
  call_sign?: string;
  imo_number?: string;
  flag?: string;
  destination?: string;
  eta?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  course?: number;
  heading?: number;
}

interface Vessel {
  id: number;
  name: string;
  mmsi: string;
  vessel_type: string;
  length: number;
  width: number;
  draft: number;
  gross_tonnage: number;
  call_sign: string;
  imo_number: string;
  flag: string;
  destination: string;
  eta: string;
  status: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  heading: number;
  created_at: number;
  updated_at: number;
}

export default function Vessels() {
  const { user } = useAuthStore();
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVessel, setEditingVessel] = useState<Vessel | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMMSI, setSearchMMSI] = useState('');
  const [searching, setSearching] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VesselFormData>();

  useEffect(() => {
    if (!user) return;
    if (!hasPermission(user.role_id, ['ADMIN', 'HQ', 'OPERATOR'])) {
      toast.error('Bạn không có quyền truy cập trang này');
      return;
    }
    loadVessels();
  }, [user]);

  const loadVessels = async (nameFilter?: string) => {
    try {
      setLoading(true);
      const response = await vesselsAPI.getAll(nameFilter);
      console.log('Vessels API response:', response);
      const vesselsData = Array.isArray(response.data) ? response.data : [];
      setVessels(vesselsData);
    } catch (error: any) {
      console.error('Error loading vessels:', error);
      setVessels([]);
      toast.error(error.response?.data?.error || 'Lỗi khi tải danh sách tàu thuyền');
    } finally {
      setLoading(false);
    }
  };

  const searchByMMSI = async (mmsi: string) => {
    if (!mmsi.trim()) {
      toast.error('Vui lòng nhập MMSI để tìm kiếm');
      return;
    }

    try {
      setSearching(true);
      const response = await vesselsAPI.getByMMSI(mmsi);
      console.log('MMSI search response:', response);
      if (response.data) {
        setVessels([response.data]);
        toast.success('Tìm thấy tàu theo MMSI');
      }
    } catch (error: any) {
      console.error('Error searching by MMSI:', error);
      if (error.response?.status === 404) {
        toast.error('Không tìm thấy tàu với MMSI này');
        setVessels([]);
      } else {
        toast.error(error.response?.data?.error || 'Lỗi khi tìm kiếm theo MMSI');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      loadVessels(searchTerm);
    } else {
      loadVessels();
    }
  };

  const handleOpenModal = (vessel?: Vessel) => {
    setEditingVessel(vessel || null);
    if (vessel) {
      reset({
        name: vessel.name,
        mmsi: vessel.mmsi,
        vessel_type: vessel.vessel_type,
        length: vessel.length,
        width: vessel.width,
        draft: vessel.draft,
        gross_tonnage: vessel.gross_tonnage,
        call_sign: vessel.call_sign,
        imo_number: vessel.imo_number,
        flag: vessel.flag,
        destination: vessel.destination,
        eta: vessel.eta,
        status: vessel.status,
        latitude: vessel.latitude,
        longitude: vessel.longitude,
        speed: vessel.speed,
        course: vessel.course,
        heading: vessel.heading,
      });
    } else {
      reset({
        name: '',
        mmsi: '',
        vessel_type: 'cargo',
        status: 'underway',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVessel(null);
    reset();
  };

  const onSubmit = async (data: VesselFormData) => {
    setSubmitting(true);
    try {
      if (editingVessel) {
        await vesselsAPI.update(editingVessel.id, data);
        toast.success('Cập nhật tàu thuyền thành công');
      } else {
        await vesselsAPI.create(data);
        toast.success('Tạo tàu thuyền thành công');
      }
      handleCloseModal();
      loadVessels();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi khi lưu tàu thuyền');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (vessel: Vessel) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tàu "${vessel.name}"?`)) {
      return;
    }

    try {
      await vesselsAPI.delete(vessel.id);
      toast.success('Xóa tàu thuyền thành công');
      loadVessels();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi khi xóa tàu thuyền');
    }
  };

  const getVesselTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'cargo': return '🚢';
      case 'tanker': return '🛢️';
      case 'passenger': return '🛳️';
      case 'fishing': return '🎣';
      case 'military': return '⚓';
      case 'yacht': return '🛥️';
      default: return '🚢';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'underway': return 'bg-green-100 text-green-800';
      case 'anchored': return 'bg-yellow-100 text-yellow-800';
      case 'moored': return 'bg-blue-100 text-blue-800';
      case 'not_under_command': return 'bg-red-100 text-red-800';
      case 'restricted_maneuverability': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    const statusMap = {
      'underway': 'Đang di chuyển',
      'anchored': 'Thả neo',
      'moored': 'Cập cảng',
      'not_under_command': 'Mất kiểm soát',
      'restricted_maneuverability': 'Hạn chế di chuyển'
    };
    return statusMap[status?.toLowerCase() as keyof typeof statusMap] || status;
  };

  if (!user || !hasPermission(user.role_id, ['ADMIN', 'HQ', 'OPERATOR'])) {
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
              <h1 className="text-2xl font-bold text-gray-900">Quản lý tàu thuyền</h1>
              <p className="mt-1 text-sm text-gray-500">
                Quản lý thông tin tàu thuyền trong hệ thống radar
              </p>
            </div>
            {hasPermission(user.role_id, ['ADMIN', 'HQ']) && (
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Thêm tàu mới
              </button>
            )}
          </div>

          {/* Search Section */}
          <div className="bg-white shadow rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search by Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tìm kiếm theo tên tàu
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nhập tên tàu..."
                    className="flex-1 border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <MagnifyingGlassIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Search by MMSI */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tìm kiếm theo MMSI
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={searchMMSI}
                    onChange={(e) => setSearchMMSI(e.target.value)}
                    placeholder="Nhập MMSI..."
                    className="flex-1 border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && searchByMMSI(searchMMSI)}
                  />
                  <button
                    onClick={() => searchByMMSI(searchMMSI)}
                    disabled={searching}
                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <MagnifyingGlassIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSearchMMSI('');
                  loadVessels();
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Xóa bộ lọc
              </button>
              <p className="text-sm text-gray-500">
                Tìm thấy {vessels.length} tàu thuyền
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {Array.isArray(vessels) && vessels.map((vessel) => (
                  <li key={vessel.id}>
                    <div className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{getVesselTypeIcon(vessel.vessel_type)}</span>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-blue-600">
                                {vessel.name}
                              </p>
                              <span className={cn(
                                'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                                getStatusColor(vessel.status)
                              )}>
                                {formatStatus(vessel.status)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              MMSI: {vessel.mmsi} • Loại: {vessel.vessel_type} • Cờ: {vessel.flag}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {hasPermission(user.role_id, ['ADMIN', 'HQ']) && (
                            <>
                              <button
                                onClick={() => handleOpenModal(vessel)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Chỉnh sửa"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(vessel)}
                                className="text-red-600 hover:text-red-900"
                                title="Xóa"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Vessel Details */}
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
                        <div>
                          <span className="font-medium">Vị trí:</span><br />
                          {vessel.latitude && vessel.longitude ? 
                            `${vessel.latitude.toFixed(4)}, ${vessel.longitude.toFixed(4)}` : 
                            'Không xác định'
                          }
                        </div>
                        <div>
                          <span className="font-medium">Tốc độ:</span><br />
                          {vessel.speed ? `${vessel.speed} knots` : 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Hướng:</span><br />
                          {vessel.course ? `${vessel.course}°` : 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Đích đến:</span><br />
                          {vessel.destination || 'Không xác định'}
                        </div>
                      </div>

                      {vessel.length && vessel.width && (
                        <div className="mt-2 text-xs text-gray-500">
                          <span className="font-medium">Kích thước:</span> {vessel.length}m × {vessel.width}m
                          {vessel.draft && ` • Mớn nước: ${vessel.draft}m`}
                          {vessel.gross_tonnage && ` • Trọng tải: ${vessel.gross_tonnage} GT`}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {(!Array.isArray(vessels) || vessels.length === 0) && (
                <div className="text-center py-8">
                  <MapIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">
                    {searchTerm || searchMMSI ? 'Không tìm thấy tàu thuyền nào' : 'Chưa có tàu thuyền nào được tạo'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Vessel Form Modal */}
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
                    <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <Dialog.Title
                          as="h3"
                          className="text-lg font-medium leading-6 text-gray-900"
                        >
                          {editingVessel ? 'Chỉnh sửa tàu thuyền' : 'Thêm tàu thuyền mới'}
                        </Dialog.Title>
                        <button
                          onClick={handleCloseModal}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>

                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Basic Information */}
                        <div>
                          <h4 className="text-md font-medium text-gray-900 mb-3">Thông tin cơ bản</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Tên tàu *
                              </label>
                              <input
                                {...register('name', { required: 'Vui lòng nhập tên tàu' })}
                                type="text"
                                className={cn(
                                  'mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
                                  errors.name && 'border-red-300'
                                )}
                              />
                              {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                MMSI *
                              </label>
                              <input
                                {...register('mmsi', { required: 'Vui lòng nhập MMSI' })}
                                type="text"
                                className={cn(
                                  'mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
                                  errors.mmsi && 'border-red-300'
                                )}
                              />
                              {errors.mmsi && (
                                <p className="mt-1 text-sm text-red-600">{errors.mmsi.message}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Loại tàu
                              </label>
                              <select
                                {...register('vessel_type')}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              >
                                <option value="cargo">Tàu hàng</option>
                                <option value="tanker">Tàu chở dầu</option>
                                <option value="passenger">Tàu khách</option>
                                <option value="fishing">Tàu cá</option>
                                <option value="military">Tàu quân sự</option>
                                <option value="yacht">Du thuyền</option>
                                <option value="other">Khác</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Trạng thái
                              </label>
                              <select
                                {...register('status')}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              >
                                <option value="underway">Đang di chuyển</option>
                                <option value="anchored">Thả neo</option>
                                <option value="moored">Cập cảng</option>
                                <option value="not_under_command">Mất kiểm soát</option>
                                <option value="restricted_maneuverability">Hạn chế di chuyển</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Ship Details */}
                        <div>
                          <h4 className="text-md font-medium text-gray-900 mb-3">Thông số kỹ thuật</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Chiều dài (m)
                              </label>
                              <input
                                {...register('length', { valueAsNumber: true })}
                                type="number"
                                step="0.1"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Chiều rộng (m)
                              </label>
                              <input
                                {...register('width', { valueAsNumber: true })}
                                type="number"
                                step="0.1"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Mớn nước (m)
                              </label>
                              <input
                                {...register('draft', { valueAsNumber: true })}
                                type="number"
                                step="0.1"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Trọng tải (GT)
                              </label>
                              <input
                                {...register('gross_tonnage', { valueAsNumber: true })}
                                type="number"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Ký hiệu gọi
                              </label>
                              <input
                                {...register('call_sign')}
                                type="text"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Số IMO
                              </label>
                              <input
                                {...register('imo_number')}
                                type="text"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Navigation Info */}
                        <div>
                          <h4 className="text-md font-medium text-gray-900 mb-3">Thông tin hành trình</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Cờ quốc gia
                              </label>
                              <input
                                {...register('flag')}
                                type="text"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Điểm đến
                              </label>
                              <input
                                {...register('destination')}
                                type="text"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Vĩ độ
                              </label>
                              <input
                                {...register('latitude', { valueAsNumber: true })}
                                type="number"
                                step="0.000001"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Kinh độ
                              </label>
                              <input
                                {...register('longitude', { valueAsNumber: true })}
                                type="number"
                                step="0.000001"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Tốc độ (knots)
                              </label>
                              <input
                                {...register('speed', { valueAsNumber: true })}
                                type="number"
                                step="0.1"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Hướng di chuyển (°)
                              </label>
                              <input
                                {...register('course', { valueAsNumber: true })}
                                type="number"
                                min="0"
                                max="360"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                          <button
                            type="button"
                            onClick={handleCloseModal}
                            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            disabled={submitting}
                            className={cn(
                              'inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700',
                              submitting && 'opacity-50 cursor-not-allowed'
                            )}
                          >
                            {submitting ? 'Đang lưu...' : editingVessel ? 'Cập nhật' : 'Tạo mới'}
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