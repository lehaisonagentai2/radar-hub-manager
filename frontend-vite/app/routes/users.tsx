import { useState, useEffect } from 'react';
import { usersAPI, stationsAPI, type User, type Station } from '../lib/api';
import { useAuthStore } from '../lib/store';
import Layout from '../components/Layout';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  UserIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface UserFormData {
  username: string;
  password: string;
  full_name: string;
  role_id: 'ADMIN' | 'OPERATOR' | 'HQ';
  station_id?: number;
}

export default function Users() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    full_name: '',
    role_id: 'OPERATOR',
    station_id: undefined,
  });

  useEffect(() => {
    loadUsers();
    loadStations();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      toast.error('Không thể tải danh sách người dùng');
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStations = async () => {
    try {
      const response = await stationsAPI.getAll();
      setStations(response.data);
    } catch (error) {
      console.error('Error loading stations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // Update existing user
        const { password, ...updateData } = formData;
        const dataToUpdate = password ? formData : updateData;
        await usersAPI.update(editingUser.username, dataToUpdate);
        toast.success('Cập nhật người dùng thành công');
      } else {
        // Create new user
        await usersAPI.create(formData);
        toast.success('Tạo người dùng thành công');
      }
      
      setShowModal(false);
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        full_name: '',
        role_id: 'OPERATOR',
        station_id: undefined,
      });
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể lưu người dùng');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      full_name: user.full_name,
      role_id: user.role_id,
      station_id: user.station_id,
    });
    setShowModal(true);
  };

  const handleDelete = async (username: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này không?')) return;
    
    try {
      await usersAPI.delete(username);
      toast.success('Xóa người dùng thành công');
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa người dùng');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'HQ': return 'bg-blue-100 text-blue-800';
      case 'OPERATOR': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <ShieldCheckIcon className="w-4 h-4" />;
      default: return <UserIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
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
            <h1 className="text-2xl font-bold text-gray-900">Quản Lý Người Dùng</h1>
            <p className="text-gray-600">Quản lý người dùng trạm radar và quyền hạn</p>
          </div>
          {user?.role_id === 'ADMIN' && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Thêm Người Dùng</span>
            </button>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người Dùng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vai Trò
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành Động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name}
                        </div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role_id)}`}>
                        {getRoleIcon(user.role_id)}
                        <span>{user.role_id}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.station?.name || 'Chưa phân công'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {user?.role_id === 'ADMIN' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-indigo-600 hover:text-indigo-900 p-1"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.username)}
                            className="text-red-600 hover:text-red-900 p-1"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Form Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingUser ? 'Chỉnh Sửa Người Dùng' : 'Thêm Người Dùng Mới'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên Đăng Nhập
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!!editingUser}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mật Khẩu {editingUser && '(để trống để giữ mật khẩu hiện tại)'}
                    </label>
                    <input
                      type="password"
                      required={!editingUser}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ Tên
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vai Trò
                    </label>
                    <select
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.role_id}
                      onChange={(e) => setFormData({ ...formData, role_id: e.target.value as 'ADMIN' | 'OPERATOR' | 'HQ' })}
                    >
                      <option value="OPERATOR">Điều Hành</option>
                      <option value="HQ">Trung Tâm</option>
                      <option value="ADMIN">Quản Trị</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạm
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.station_id || ''}
                      onChange={(e) => setFormData({ ...formData, station_id: e.target.value ? Number(e.target.value) : undefined })}
                    >
                      <option value="">Chưa phân công</option>
                      {stations.map((station) => (
                        <option key={station.id} value={station.id}>
                          {station.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingUser(null);
                        setFormData({
                          username: '',
                          password: '',
                          full_name: '',
                          role_id: 'OPERATOR',
                          station_id: undefined,
                        });
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-md hover:bg-gray-300"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                      {editingUser ? 'Cập Nhật' : 'Tạo Mới'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
