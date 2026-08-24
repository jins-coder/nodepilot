import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { useUiStore } from "@/stores";
import type { ToastMessage } from "@/types";

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles = {
  success: "border-success/30 bg-success-muted",
  error: "border-danger/30 bg-danger-subtle",
  info: "border-accent/30 bg-accent-subtle",
  warning: "border-warning/30 bg-warning-subtle",
};

const iconStyles = {
  success: "text-success",
  error: "text-danger",
  info: "text-accent",
  warning: "text-warning",
};

function Toast({ toast }: { toast: ToastMessage }) {
  const { removeToast } = useUiStore();
  const Icon = icons[toast.type];

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-card
                  animate-slide-up ${styles[toast.type]} min-w-[280px] max-w-[360px]`}
    >
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconStyles[toast.type]}`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary">{toast.title}</div>
        {toast.message && (
          <div className="text-xs text-text-secondary mt-0.5 leading-relaxed line-clamp-2">
            {toast.message}
          </div>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-text-tertiary hover:text-text-primary transition-colors p-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useUiStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
