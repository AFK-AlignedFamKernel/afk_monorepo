import React, { useEffect } from 'react';
import classNames from 'classnames';
import styles from '../../styles/components/toast.module.scss';

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
        styles.toast,
        {
          [styles['toast--visible']]: visible,
          [styles[`toast--${type}`]]: type,
        },
        className
      )}
    >
      <div className={styles['toast__content']}>
        <p>{message}</p>
        <button
          className={styles['toast__close']}
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