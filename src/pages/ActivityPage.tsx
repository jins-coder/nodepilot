import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Activity,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
  Terminal as TerminalIcon,
} from "lucide-react";
import { useActivityStore } from "@/stores";
import { loadActivity, clearActivity } from "@/services/activityService";
import { ConfirmModal } from "@/components/ui/Modal";
import { timeAgo, formatTime } from "@/utils/versions";
import type { ActivityEntry } from "@/types";

export function ActivityPage() {
  const { entries, isLoading, setEntries, setLoading, clearEntries } = useActivityStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await loadActivity();
        setEntries(data.reverse()); // newest first
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleClear = async () => {
    await clearActivity();
    clearEntries();
    setShowClearConfirm(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="text-sm text-text-tertiary">
          {entries.length} operation{entries.length !== 1 ? "s" : ""} recorded
        </div>
        {entries.length > 0 && (
          <button
            id="clear-activity-btn"
            className="btn-danger btn-sm"
            onClick={() => setShowClearConfirm(true)}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-text-tertiary">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading activity...</span>
        </div>
      ) : entries.length === 0 ? (
        <div className="py-20 text-center">
          <Activity className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <div className="text-sm text-text-secondary">No activity recorded yet.</div>
          <div className="text-xs text-text-muted mt-1">
            Operations like installing and switching versions will appear here.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <ActivityCard
              key={entry.id}
              entry={entry}
              isExpanded={expandedEntries.has(entry.id)}
              onToggle={() => toggleExpand(entry.id)}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClear}
        title="Clear Activity Log"
        message="This will permanently delete all activity entries. This action cannot be undone."
        confirmLabel="Clear All"
        confirmVariant="danger"
      />
    </div>
  );
}

interface ActivityCardProps {
  entry: ActivityEntry;
  isExpanded: boolean;
  onToggle: () => void;
}

function ActivityCard({ entry, isExpanded, onToggle }: ActivityCardProps) {
  const isSuccess = entry.status === "success";
  const isError = entry.status === "error";
  const isRunning = entry.status === "running";

  return (
    <div className="glass-card overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-hover transition-colors text-left"
        onClick={onToggle}
      >
        {/* Status icon */}
        <div className="shrink-0">
          {isRunning ? (
            <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />
          ) : isSuccess ? (
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-500" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-heading truncate">
              {entry.operation}
            </span>
            <span
              className={`badge text-xs ${
                isSuccess ? "badge-lts" : isError ? "badge-current text-rose-500 border-rose-500/30" : "badge-installed"
              }`}
            >
              {isSuccess ? "✓ Success" : isError ? "✗ Error" : "Running"}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-2xs text-text-muted">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(entry.timestamp)} · {timeAgo(entry.timestamp)}
            </span>
            {entry.result && (
              <span>{entry.result.durationMs}ms</span>
            )}
            <span className="mono">{entry.command} {entry.args.join(" ")}</span>
          </div>
        </div>

        {/* Expand chevron */}
        <div className="shrink-0 text-text-muted">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      {isExpanded && entry.result && (
        <div className="border-t border-bg-border bg-bg-tertiary px-4 py-3 space-y-3">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-text-muted mb-1">Command</div>
              <div className="mono text-text-secondary">
                {entry.command} {entry.args.join(" ")}
              </div>
            </div>
            <div>
              <div className="text-text-muted mb-1">Exit Code</div>
              <div className={`mono font-semibold ${entry.result.exitCode === 0 ? "text-success" : "text-danger"}`}>
                {entry.result.exitCode}
              </div>
            </div>
            <div>
              <div className="text-text-muted mb-1">Duration</div>
              <div className="mono text-text-secondary">{entry.result.durationMs}ms</div>
            </div>
          </div>

          {entry.result.stdout && (
            <div>
              <div className="flex items-center gap-1.5 text-2xs text-text-muted mb-1.5">
                <TerminalIcon className="w-3 h-3" />
                stdout
              </div>
              <div className="terminal p-3 max-h-32">
                {entry.result.stdout.split("\n").map((line, i) => (
                  <div key={i} className="terminal-line text-text-secondary">{line || "\u00A0"}</div>
                ))}
              </div>
            </div>
          )}

          {entry.result.stderr && (
            <div>
              <div className="flex items-center gap-1.5 text-2xs text-danger-bright mb-1.5">
                <TerminalIcon className="w-3 h-3" />
                stderr
              </div>
              <div className="terminal p-3 max-h-32">
                {entry.result.stderr.split("\n").map((line, i) => (
                  <div key={i} className="terminal-line text-danger">{line || "\u00A0"}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
