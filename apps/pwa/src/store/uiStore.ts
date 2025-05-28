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
    description: string;
    duration?:number;
  };
  showModal: (content: React.ReactNode) => void;
  hideModal: () => void;
  showToast: ({message, type, description, duration}: {message: string, type?: ToastType, description?: string, duration?:number}) => void;
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
    description: '',
    duration: 3000,
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
  showToast: ({message, type = 'info', description = '', duration = 3000}) =>
    set({
      toast: {
        isVisible: true,
        message,
        type,
        description,  
        duration,
      },
    }),
  hideToast: () =>
    set({
      toast: {
        isVisible: false,
        message: '',
        type: 'info',
        description: '',
        duration: 3000,
      },
    }),
})); 