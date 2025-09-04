import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Fragment } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { XMarkIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useStationStore } from '../lib/store';
import { commandsAPI } from '../lib/api';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

interface AlertFormData {
  stationIds: number[];
  title: string;
  message: string;
}

interface SendAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SendAlertModal({ isOpen, onClose }: SendAlertModalProps) {
  const { stations } = useStationStore();
  const [selectedStations, setSelectedStations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AlertFormData>();

  const onSubmit = async (data: AlertFormData) => {
    if (selectedStations.length === 0) {
      toast.error('Vui lòng chọn ít nhất một trạm');
      return;
    }

    setIsLoading(true);
    try {
      await Promise.all(
        selectedStations.map(station =>
          commandsAPI.create({
            content: `${data.title}: ${data.message}`,
            to_station_id: station.id,
          })
        )
      );

      toast.success(`Đã gửi thông báo đến ${selectedStations.length} trạm`);
      reset();
      setSelectedStations([]);
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi khi gửi thông báo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedStations([]);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
                    Gửi thông báo/lệnh
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chọn trạm
                    </label>
                    <Listbox value={selectedStations} onChange={setSelectedStations} multiple>
                      <div className="relative">
                        <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                          <span className="block truncate">
                            {selectedStations.length === 0
                              ? 'Chọn trạm...'
                              : selectedStations.length === 1
                              ? selectedStations[0].name
                              : `Đã chọn ${selectedStations.length} trạm`}
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon
                              className="h-5 w-5 text-gray-400"
                              aria-hidden="true"
                            />
                          </span>
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
                            {stations.map((station) => (
                              <Listbox.Option
                                key={station.id}
                                className={({ active }) =>
                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                                  }`
                                }
                                value={station}
                              >
                                {({ selected }) => (
                                  <>
                                    <span
                                      className={`block truncate ${
                                        selected ? 'font-medium' : 'font-normal'
                                      }`}
                                    >
                                      {station.name}
                                    </span>
                                    {selected ? (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>

                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Tiêu đề
                    </label>
                    <input
                      {...register('title', { required: 'Vui lòng nhập tiêu đề' })}
                      type="text"
                      className={cn(
                        'mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
                        errors.title && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      )}
                      placeholder="Nhập tiêu đề thông báo"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                      Nội dung
                    </label>
                    <textarea
                      {...register('message', { required: 'Vui lòng nhập nội dung' })}
                      rows={4}
                      className={cn(
                        'mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm',
                        errors.message && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      )}
                      placeholder="Nhập nội dung thông báo hoặc lệnh"
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={cn(
                        'inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                        isLoading && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {isLoading ? 'Đang gửi...' : 'Gửi thông báo'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
