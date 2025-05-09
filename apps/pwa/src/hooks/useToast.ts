import { useState, useCallback } from 'react';

interface Toast {
  title: string;
  type: 'success' | 'error' | 'info';
  id?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(({ title, type }: Toast) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { title, type, id }]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
}; 