import { useState, useCallback } from 'react';

export interface ToastProps {
  id?: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

interface ToastState extends ToastProps {
  id: string;
}

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const toast = useCallback(({ title, description, variant = 'default', duration = 3000, ...props }: ToastProps) => {
    const id = `toast-${++toastId}`;
    const newToast: ToastState = { 
      id, 
      title, 
      description, 
      variant, 
      duration,
      ...props 
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    
    // For development, also log to console
    console.log(`Toast (${variant}): ${title}${description ? ` - ${description}` : ''}`);
    
    return id;
  }, []);

  const dismissToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return { 
    toast, 
    toasts, 
    dismiss: dismissToast, 
    dismissAll 
  };
} 