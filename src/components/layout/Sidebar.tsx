import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Layers,
  DownloadCloud,
  Activity,
  Sliders,
  Terminal,
  Loader2,
  AlertCircle,
  Cpu,
} from "lucide-react";
import { useNvmStore } from "@/stores";
import packageJson from "../../../package.json";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", badge: null },
  { to: "/versions", icon: Layers, label: "Node Versions", badge: "versions" },
  { to: "/install", icon: DownloadCloud, label: "Install Node", badge: "new" },
  { to: "/activity", icon: Activity, label: "Activity Log", badge: null },
  { to: "/settings", icon: Sliders, label: "Settings", badge: null },
];

export function Sidebar() {
  const { nvmStatus, installedVersions, isLoadingStatus } = useNvmStore();

  return (
    <aside className="w-60 shrink-0 h-full bg-white dark:bg-[#121420] border-r border-slate-200 dark:border-white/10 flex flex-col select-none transition-colors duration-200">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-glow text-white font-black text-base shrink-0">
            <Terminal className="w-4 h-4 text-white" />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-[#090a10]" />
          </div>
          <div>
            <div className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
              NodePilot
            </div>
            <div className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400">
              Desktop v{packageJson.version}
            </div>
          </div>
        </div>
      </div>

      {/* Nav Section */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 pb-2">
          Navigation
        </div>
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer select-none group ${
                isActive
                  ? "bg-brand-500 text-white shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"}`} />
                <span className="flex-1 truncate">{label}</span>
                {badge === "versions" && installedVersions.length > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {installedVersions.length}
                  </span>
                )}
                {badge === "new" && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-brand-500/10 text-brand-600 dark:text-brand-300"
                    }`}
                  >
                    Hub
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer System Status Card */}
      <div className="p-3">
        <div className="p-3 space-y-2 rounded-xl bg-slate-50 dark:bg-[#161928] border border-slate-200 dark:border-white/10 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Engine Status
            </span>
            {isLoadingStatus ? (
              <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
            ) : nvmStatus?.installed ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                Active
              </div>
            ) : (
              <div className="flex items-center gap-1 text-rose-500 text-[10px] font-bold">
                <AlertCircle className="w-3 h-3" />
                Not found
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
              {nvmStatus?.installed ? `nvm-windows v${nvmStatus.version}` : "NVM required"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
