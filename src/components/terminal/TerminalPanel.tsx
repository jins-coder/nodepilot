import { X, Copy, Terminal as TerminalIcon, Trash2, Check } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { useUiStore } from "@/stores";

export function TerminalPanel() {
  const { terminalLines, clearTerminalLines, setTerminalOpen, addToast } = useUiStore();
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLines]);

  const copyAll = () => {
    navigator.clipboard.writeText(terminalLines.join("\n")).then(() => {
      setCopied(true);
      addToast({ type: "info", title: "Terminal log copied", duration: 1500 });
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const getLineStyle = (line: string): string => {
    if (line.startsWith("✓") || line.includes("successfully") || line.includes("Complete")) {
      return "text-emerald-400 font-semibold";
    }
    if (line.startsWith("✗") || line.includes("Error") || line.includes("error") || line.includes("failed") || line.startsWith("[stderr]")) {
      return "text-rose-400 font-semibold";
    }
    if (line.startsWith(">")) {
      return "text-brand-300 font-bold";
    }
    return "text-text-muted";
  };

  return (
    <div className="border-t border-bg-border bg-black/95 backdrop-blur-2xl shrink-0 flex flex-col z-20 shadow-modal" style={{ height: "220px" }}>
      {/* Terminal Titlebar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 hover:bg-rose-400 cursor-pointer" onClick={() => setTerminalOpen(false)} />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-1.5 pl-2 text-2xs font-mono font-bold text-text-heading">
            <TerminalIcon className="w-3.5 h-3.5 text-brand-400" />
            <span>Process Output Terminal</span>
            <span className="text-3xs font-mono text-text-faint font-normal">
              ({terminalLines.length} events)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            id="terminal-copy-btn"
            className="btn-ghost btn-xs gap-1"
            onClick={copyAll}
            title="Copy entire log"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
          <button
            id="terminal-clear-btn"
            className="btn-ghost btn-xs gap-1"
            onClick={clearTerminalLines}
            title="Clear terminal buffer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
          <button
            id="terminal-close-btn"
            className="btn-ghost btn-xs p-1"
            onClick={() => setTerminalOpen(false)}
            title="Close Drawer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Lines Container */}
      <div className="flex-1 overflow-y-auto px-4 py-2.5 font-mono text-xs space-y-0.5 leading-relaxed">
        {terminalLines.length === 0 ? (
          <div className="text-text-faint italic py-2">
            Terminal ready. Operations will stream output here in real-time.
          </div>
        ) : (
          terminalLines.map((line, i) => (
            <div key={i} className={`flex items-start gap-2 ${getLineStyle(line)}`}>
              <span className="text-3xs text-text-faint select-none shrink-0 font-mono mt-0.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="break-all">{line || "\u00A0"}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
