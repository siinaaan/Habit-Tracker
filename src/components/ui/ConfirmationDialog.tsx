import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to delete this?',
  confirmText = 'Yes, Delete',
  cancelText = 'Cancel',
  isDanger = true,
}) => {
  const [isConfirming, setIsConfirming] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsConfirming(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (isConfirming) return;
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="space-y-4 text-slate-300">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <p className="text-sm font-semibold">{message}</p>
        </div>

        <p className="text-xs text-slate-400">
          This operation cannot be undone. Please confirm you want to proceed.
        </p>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="outline" onClick={onClose} disabled={isConfirming}>
            {cancelText}
          </Button>
          <Button
            variant={isDanger ? 'danger' : 'primary'}
            disabled={isConfirming}
            onClick={handleConfirm}
          >
            {isConfirming ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
