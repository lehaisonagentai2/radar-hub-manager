import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PhoneIcon, UserIcon, ClockIcon } from '@heroicons/react/24/outline';
import { parseTimeString } from '../lib/utils';

interface StationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  station: any;
  hour: number;
  schedules: any[];
}

export default function StationDetailModal({
  isOpen,
  onClose,
  station,
  hour,
  schedules,
}: StationDetailModalProps) {
  if (!station) return null;

  // Find schedules that are active during the selected hour
  const activeSchedules = schedules.filter(schedule => {
    const startTime = parseTimeString(schedule.start_hhmm);
    const endTime = parseTimeString(schedule.end_hhmm);
    
    const startInMinutes = startTime.hours * 60 + startTime.minutes;
    let endInMinutes = endTime.hours * 60 + endTime.minutes;
    const hourInMinutes = hour * 60;
    
    // Handle overnight shifts
    if (endInMinutes <= startInMinutes) {
      endInMinutes += 24 * 60;
      if (hourInMinutes < startInMinutes) {
        return hourInMinutes + 24 * 60 >= startInMinutes && hourInMinutes + 24 * 60 <= endInMinutes;
      }
    }
    
    return hourInMinutes >= startInMinutes && hourInMinutes <= endInMinutes;
  });

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Chi tiết ca trực - {station.name}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Thời gian: {hour.toString().padStart(2, '0')}:00 - {(hour + 1).toString().padStart(2, '0')}:00
                  </div>
                  <div className="text-sm text-gray-600">
                    Vị trí: {station.latitude?.toFixed(4)}, {station.longitude?.toFixed(4)}
                  </div>
                  {station.elevation && (
                    <div className="text-sm text-gray-600">
                      Độ cao: {station.elevation}m
                    </div>
                  )}
                  {station.status && (
                    <div className="text-sm text-gray-600">
                      Trạng thái: {station.status}
                    </div>
                  )}
                </div>

                {activeSchedules.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Ca trực đang hoạt động:</h4>
                    {activeSchedules.map((schedule, index) => (
                      <div key={schedule.id} className="border rounded-lg p-4 bg-green-50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-green-800">
                            Ca {index + 1}
                          </span>
                          <span className="text-sm text-green-600">
                            {schedule.start_hhmm} - {schedule.end_hhmm}
                          </span>
                        </div>
                        
                        {schedule.commander && (
                          <div className="flex items-center mb-2">
                            <UserIcon className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm">
                              <span className="font-medium">Chỉ huy ca:</span> {schedule.commander}
                            </span>
                          </div>
                        )}
                        
                        {schedule.crew && (
                          <div className="flex items-center mb-2">
                            <UserIcon className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm">
                              <span className="font-medium">Tổ trực:</span> {schedule.crew}
                            </span>
                          </div>
                        )}
                        
                        {schedule.phone && (
                          <div className="flex items-center">
                            <PhoneIcon className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm">
                              <span className="font-medium">Điện thoại:</span> {schedule.phone}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ClockIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>Không có ca trực nào hoạt động trong khung giờ này</p>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    Đóng
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
