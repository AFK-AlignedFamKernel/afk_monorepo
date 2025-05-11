import { create } from 'zustand';
import { ToastType } from '../components/Toast/Toast';

interface UIState {
  modal: {
    isOpen: boolean;
    content: React.ReactNode | null;
  };
  toast: {
    isVisible: boolean;
    message: string;
    type: ToastType;
  };
  showModal: (content: React.ReactNode) => void;
  hideModal: () => void;
  showToast: ({message, type}: {message: string, type?: ToastType}) => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  modal: {
    isOpen: false,
    content: null,
  },
  toast: {
    isVisible: false,
    message: '',
    type: 'info',
  },
  showModal: (content) =>
    set({
      modal: {
        isOpen: true,
        content,
      },
    }),
  hideModal: () =>
    set({
      modal: {
        isOpen: false,
        content: null,
      },
    }),
  showToast: ({message, type = 'info'}) =>
    set({
      toast: {
        isVisible: true,
        message,
        type,
      },
    }),
  hideToast: () =>
    set({
      toast: {
        isVisible: false,
        message: '',
        type: 'info',
      },
    }),
})); 