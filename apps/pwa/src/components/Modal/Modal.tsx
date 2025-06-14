import React, { useEffect } from 'react';
import classNames from 'classnames';
import '../../styles/components/_modal.scss';

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
    <div className="modal" data-theme={theme}>
      <div
        className={classNames('modal__overlay', {
          'modal__overlay--visible': isOpen,
        })}
        onClick={handleOverlayClick}
      />
      <div className="modal__container">
        <div className="modal__content">
          <div
            className={classNames(
              'modal__panel',
              {
                'modal__panel--visible': isOpen,
                [`modal__panel--${size}`]: size,
                [`modal__panel--h-${height}`]: height,
                [`modal__panel--${position}`]: position,
                [`modal__panel--scroll-${scrollBehavior}`]: scrollBehavior,
              },
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >

            <div className='modal__content-container'>
              {showCloseButton && (
                <button
                  className="modal__close-button"
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  <svg
                    className="h-6 w-6"
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