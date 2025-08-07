import React, { useEffect } from 'react';
import { Command } from '../types/api';

interface NotificationModalProps {
  commands: Command[];
  onClose: () => void;
  onAcknowledge: (commandId: number) => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ commands, onClose, onAcknowledge }) => {
  // Play notification sound when modal opens
  useEffect(() => {
    const audio = new Audio();
    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBjiS1/LMeS0GJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBjiS1/LMeS0GJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBjiS1/LMeS0GJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBjiS1/LMeS0GJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBjiS1/LMeS0GJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBjiS1/LMeS0GJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBjiS1/LMeS0GJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBjiS1/LMeS0GJHfH8N2QQAoUXrTp66hVFA==';
    audio.play().catch(() => {
      // Fallback if audio play fails (e.g., autoplay policy)
      console.log('Could not play notification sound');
    });
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border w-96 shadow-xl rounded-lg bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-red-600 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            New Command Alert!
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">
            You have {commands.length} new command(s) from HQ:
          </p>
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto">
          {commands.map((command) => (
            <div key={command.id} className="border border-red-200 bg-red-50 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm text-gray-900 font-medium">{command.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Received: {new Date(command.created_at * 1000).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => onAcknowledge(command.id)}
                  className="ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                >
                  ACK
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
