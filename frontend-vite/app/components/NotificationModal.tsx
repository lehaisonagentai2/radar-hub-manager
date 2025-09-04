import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useWebSocketStore } from '../lib/store';
import { commandsAPI } from '../lib/api';
import toast from 'react-hot-toast';

export default function NotificationModal() {
  const { notifications, removeNotification } = useWebSocketStore();
  const activeNotification = notifications[0];

  const handleAcknowledge = async () => {
    if (activeNotification?.id && activeNotification?.type === 'command') {
      try {
        await commandsAPI.acknowledge(parseInt(activeNotification.id));
        toast.success('Đã xác nhận lệnh');
      } catch (error) {
        toast.error('Lỗi khi xác nhận lệnh');
      }
    }
    removeNotification(activeNotification.id);
  };

  const handleDismiss = () => {
    removeNotification(activeNotification.id);
  };

  if (!activeNotification) return null;

  return (
    <Transition appear show={!!activeNotification} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-2" />
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900"
                    >
                      {activeNotification.type === 'command' ? 'Lệnh mới' : 'Thông báo'}
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    {activeNotification.title && (
                      <span className="font-semibold">{activeNotification.title}</span>
                    )}
                  </p>
                  <p className="mt-2 text-gray-900">
                    {activeNotification.message || activeNotification.content}
                  </p>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={handleDismiss}
                  >
                    Đóng
                  </button>
                  {activeNotification.type === 'command' && (
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={handleAcknowledge}
                    >
                      Xác nhận
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
