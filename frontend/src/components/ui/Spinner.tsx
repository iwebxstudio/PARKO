// ============================================
// PARKO — Spinner Loading Component
// ============================================
import React from 'react';
import { Loader2 } from 'lucide-react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '', label }) => {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  };

  return (
    <div className={`inline-flex flex-col items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`animate-spin text-blue-600 dark:text-blue-400 ${sizeStyles[size]}`} />
      {label && <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>}
    </div>
  );
};
