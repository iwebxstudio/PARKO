// ============================================
// PARKO — useModal Hook
// State manager for modals and dialogs
// ============================================
import { useState, useCallback } from 'react';

export interface UseModalReturn<T = any> {
  isOpen: boolean;
  data: T | null;
  open: (data?: T) => void;
  close: () => void;
  toggle: () => void;
}

export function useModal<T = any>(initialState: boolean = false): UseModalReturn<T> {
  const [isOpen, setIsOpen] = useState<boolean>(initialState);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((modalData?: T) => {
    if (modalData !== undefined) setData(modalData);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return { isOpen, data, open, close, toggle };
}
