import { useState } from 'react';

interface Toast {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

interface ToastState extends Toast {
  id: string;
  visible: boolean;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const toast = (params: Toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastState = {
      id,
      title: params.title,
      description: params.description,
      variant: params.variant || 'default',
      duration: params.duration || 3000,
      visible: true,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss
    setTimeout(() => {
      dismiss(id);
    }, newToast.duration);

    return id;
  };

  const dismiss = (id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
    );

    // Remove from state after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  };

  return {
    toast,
    dismiss,
    toasts,
  };
} 