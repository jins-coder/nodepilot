import { RefreshCw, Sliders, Terminal as TerminalIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNvm } from "@/hooks/useNvm";
import { useUiStore } from "@/stores";

const pageTitles: Record<string, { title: string; subtitle: string; tag: string }> = {
  "/": {
    title: "Dashboard",
    subtitle: "Overview of your Node.js runtime environments",
    tag: "Runtime",
  },
  "/versions": {
    title: "Node Versions",
    subtitle: "Installed Node.js releases and symlink management",
    tag: "Manager",
  },
  "/install": {
    title: "Install Node",
    subtitle: "Browse and download official releases from nodejs.org",
    tag: "Registry",
  },
  "/activity": {
    title: "Activity Log",
    subtitle: "Detailed execution telemetry, exit codes, and stdout",
    tag: "Logs",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Configure NodePilot preferences and custom paths",
    tag: "Config",
  },
};

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refresh, isLoadingVersions } = useNvm();
  const { terminalOpen, setTerminalOpen } = useUiStore();
  const info = pageTitles[location.pathname] ?? pageTitles["/"];

  return (
    <header className="h-16 border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#121420]/95 backdrop-blur-xl px-6 flex items-center justify-between shrink-0 select-none z-10 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-300">
          {info.tag}
        </span>
        <div>
          <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-none">
            {info.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-none">
            {info.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Terminal Toggle Button */}
        <button
          id="header-terminal-btn"
          className={`btn-secondary btn-sm gap-1.5 ${
            terminalOpen ? "border-brand-500/50 bg-brand-500/10 text-brand-600 dark:text-brand-300 font-bold" : ""
          }`}
          onClick={() => setTerminalOpen(!terminalOpen)}
          title="Toggle Terminal Drawer"
        >
          <TerminalIcon className="w-3.5 h-3.5 text-brand-500" />
          <span>Terminal</span>
        </button>

        {/* Refresh button */}
        <button
          id="header-refresh-btn"
          className="btn-secondary btn-sm gap-1.5"
          onClick={refresh}
          disabled={isLoadingVersions}
          title="Sync Node.js Environment"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingVersions ? "animate-spin text-brand-500" : "text-slate-500 dark:text-slate-400"}`} />
          <span>Sync</span>
        </button>

        <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />

        {/* Settings button */}
        <button
          id="header-settings-btn"
          className="btn-ghost btn-sm p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          onClick={() => navigate("/settings")}
          title="Settings"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
