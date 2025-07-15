import React, { useEffect } from 'react';
import classNames from 'classnames';
import styles from '../../styles/components/modal.module.scss';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
type ModalHeight = 'auto' | 'sm' | 'md' | 'lg' | 'full';
type ModalPosition = 'top' | 'center' | 'bottom';
type ScrollBehavior = 'auto' | 'hidden';
type Theme = 'light' | 'dark';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  size?: ModalSize;
  height?: ModalHeight;
  position?: ModalPosition;
  scrollBehavior?: ScrollBehavior;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  theme?: Theme;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
  size = 'md',
  height = 'auto',
  position = 'center',
  scrollBehavior = 'auto',
  closeOnOverlayClick = true,
  showCloseButton = true,
  theme = 'light',
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modal} data-theme={theme}>
      <div
        className={classNames(styles['modal__overlay'], {
          [styles['modal__overlay--visible']]: isOpen,
        })}
        onClick={handleOverlayClick}
      />
      <div className={styles['modal__container']}>
        <div className={styles['modal__content']}>
          <div
            className={classNames(
              styles['modal__panel'],
              {
                [styles['modal__panel--visible']]: isOpen,
                [styles[`modal__panel--${size}`]]: size,
                [styles[`modal__panel--h-${height}`]]: height,
                [styles[`modal__panel--${position}`]]: position,
                [styles[`modal__panel--scroll-${scrollBehavior}`]]: scrollBehavior,
              },
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >

            <div className={styles['modal__content-container']}>
              {showCloseButton && (
                <button
                  className={styles['modal__close-button']}
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  <svg
                    className={' h-6 w-6'}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 