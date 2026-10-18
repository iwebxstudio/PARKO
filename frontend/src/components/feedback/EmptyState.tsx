// ============================================
// ລະບົບ PARKO — EmptyState Component (ສ່ວນສະແດງຜົນເມື່ອບໍ່ມີຂໍ້ມູນ)
// ສະແດງໄອຄອນ, ຂໍ້ຄວາມແຈ້ງເຕືອນ ແລະ ປຸ່ມດຳເນີນການ ເມື່ອຕາຕະລາງ ຫຼື ລາຍການວ່າງເປົ່າ
// ============================================
import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from '../ui/Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h4>
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button size="sm" variant="outline" onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
