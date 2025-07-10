import React, { useEffect } from 'react';
import classNames from 'classnames';
import '../../styles/components/_toast.scss';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
  visible: boolean;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onHide,
  visible,
  className,
}) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onHide?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide]);

  if (!visible) return null;

  return (
    <div
      className={classNames(
        'toast',
        {
          'toast--visible': visible,
          [`toast--${type}`]: type,
        },
        className
      )}
    >
      <div className="toast__content flex items-center justify-between">
        <p>{message}</p>
        <button
          className="toast__close ml-4 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
          aria-label="Close toast"
          onClick={onHide}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="6" y1="6" x2="14" y2="14" />
            <line x1="6" y1="14" x2="14" y2="6" />
          </svg>
        </button>
      </div>
    </div>
  );
}; 