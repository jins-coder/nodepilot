import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg";
  closeOnBackdropClick?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  width = "md",
  closeOnBackdropClick = false,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnBackdropClick) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose, closeOnBackdropClick]);

  if (!isOpen || typeof document === "undefined") return null;

  const widthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
  }[width];

  const modalContent = (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={`modal-panel ${widthClass} w-full mx-4 rounded-2xl overflow-hidden shadow-2xl z-[10000] border border-slate-200 dark:border-white/15 animate-scale-in`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1b1f32]">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
          <button
            id="modal-close-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[80vh] bg-white dark:bg-[#121420]">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "primary";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  confirmVariant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} width="sm" closeOnBackdropClick={false}>
      <div className="px-6 py-4">
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{message}</p>
        <div className="flex items-center justify-end gap-2 mt-6">
          <button id="confirm-modal-cancel" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            id="confirm-modal-confirm"
            onClick={onConfirm}
            disabled={isLoading}
            className={confirmVariant === "danger" ? "btn-danger" : "btn-primary"}
          >
            {isLoading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
