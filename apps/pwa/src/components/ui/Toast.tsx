import { Fragment } from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ToastProps {
  title: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast = ({ title, type, onClose }: ToastProps) => {
  const colors = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  return (
    <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg shadow-lg border">
      <div className={`p-4 ${colors[type]}`}>
        <div className="flex items-start">
          <div className="flex-1">
            <p className="text-sm font-medium">{title}</p>
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              type="button"
              className="inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Array<{ id: number; title: string; type: 'success' | 'error' | 'info' }>;
  onRemove: (id: number) => void;
}

export const ToastContainer = ({ toasts, onRemove }: ToastContainerProps) => {
  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6 z-50"
    >
      <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="transform transition-all duration-300 ease-out opacity-100 translate-y-0 translate-x-0"
          >
            <Toast
              title={toast.title}
              type={toast.type}
              onClose={() => onRemove(toast.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}; 