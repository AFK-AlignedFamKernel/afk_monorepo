import React from 'react';
import { Modal } from '../components/Modal/Modal';
import { Toast } from '../components/Toast/Toast';
import { useUIStore } from '../store/uiStore';

interface UIProviderProps {
  children: React.ReactNode;
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  const { modal, toast, hideModal, hideToast } = useUIStore();

  return (
    <>
      {children}
      <Modal isOpen={modal.isOpen} onClose={hideModal}>
        {modal.content}
      </Modal>
      <Toast
        visible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </>
  );
}; 