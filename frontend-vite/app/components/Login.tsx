import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { authAPI } from '../lib/api';
import { useAuthStore } from '../lib/store';
import { cn } from '../lib/utils';

interface LoginForm {
  username: string;
  password: string;
}

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(data.username, data.password);
      const { user, token } = response.data;
      
      login(user, token);
      toast.success('Đăng nhập thành công');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center mb-8">
            {/* Radar Icon */}
            <div className="flex justify-center mb-6">
              <img 
                src="/radar.svg" 
                alt="Radar Icon" 
                className="w-24 h-24"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Hệ thống Quản lý Trạm Radar
            </h2>
            <p className="mt-2 text-gray-600">
              Đăng nhập để tiếp tục
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Tên đăng nhập
              </label>
              <div className="mt-1">
                <input
                  {...register('username', { required: 'Vui lòng nhập tên đăng nhập' })}
                  type="text"
                  autoComplete="username"
                  className={cn(
                    'appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
                    errors.username && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  )}
                  placeholder="Nhập tên đăng nhập"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password', { required: 'Vui lòng nhập mật khẩu' })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={cn(
                    'appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
                    errors.password && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  )}
                  placeholder="Nhập mật khẩu"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                  isLoading && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Thông tin mặc định
                </span>
              </div>
            </div>
            <div className="mt-3 text-center text-sm text-gray-600">
              <p>Tài khoản quản trị: <span className="font-semibold">admin</span></p>
              <p>Mật khẩu: <span className="font-semibold">123456</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
