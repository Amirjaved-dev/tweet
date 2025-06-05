import React from 'react';
import { createPortal } from 'react-dom';
import { Toast, ToastTitle, ToastDescription } from './toast';
import { useToast } from '../../hooks/use-toast';

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="toast-viewport">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          onClose={() => dismiss(toast.id)}
        >
          <div className="grid gap-1">
            <ToastTitle>{toast.title}</ToastTitle>
            {toast.description && (
              <ToastDescription>{toast.description}</ToastDescription>
            )}
          </div>
        </Toast>
      ))}
    </div>,
    document.body
  );
} 