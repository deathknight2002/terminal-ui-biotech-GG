import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import styles from './Toast.module.css';
import type { Status } from '@/types';

export interface ToastMessage {
  id: string;
  message: string;
  status?: Status;
  duration?: number;
}

export interface ToastProps {
  messages: ToastMessage[];
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export const Toast: React.FC<ToastProps> = ({
  messages,
  onRemove,
  position = 'top-right',
}) => {
  if (messages.length === 0) return null;

  const toastContent = (
    <div className={clsx(styles.toastContainer, styles[position])}>
      {messages.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  );

  return createPortal(toastContent, document.body);
};

interface ToastItemProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = toast.duration || 3000;

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      className={clsx(
        styles.toast,
        toast.status && styles[toast.status],
        isExiting && styles.exiting
      )}
      role="alert"
    >
      <div className={styles.content}>
        {toast.message}
      </div>
      <button
        className={styles.closeButton}
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onRemove(toast.id), 300);
        }}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
};

// Toast Hook for easy usage
let toastCounter = 0;
const toastListeners: Array<(messages: ToastMessage[]) => void> = [];
let currentMessages: ToastMessage[] = [];

export const useToast = () => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    toastListeners.push(setMessages);
    return () => {
      const index = toastListeners.indexOf(setMessages);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  }, []);

  const notify = (message: string, status?: Status, duration?: number) => {
    const id = `toast-${++toastCounter}`;
    const newToast: ToastMessage = { id, message, status, duration };
    currentMessages = [...currentMessages, newToast];
    toastListeners.forEach(listener => listener(currentMessages));
  };

  const remove = (id: string) => {
    currentMessages = currentMessages.filter(msg => msg.id !== id);
    toastListeners.forEach(listener => listener(currentMessages));
  };

  return { messages, notify, remove };
};
