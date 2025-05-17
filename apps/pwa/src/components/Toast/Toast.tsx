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
      <div className="toast__content">
        <p>{message}</p>
      </div>
    </div>
  );
}; 