import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  Zap,
  CheckCircle2,
  DownloadCloud,
  ChevronRight,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Terminal as TerminalIcon,
  Trash2,
} from "lucide-react";
import { useNvm } from "@/hooks/useNvm";
import { useUiStore } from "@/stores";
import { VersionBadges } from "@/components/ui/VersionBadges";
import { ConfirmModal } from "@/components/ui/Modal";

export function Dashboard() {
  const navigate = useNavigate();
  const {
    nvmStatus,
    installedVersions,
    currentVersion,
    isLoadingVersions,
    isLoadingStatus,
    loadNvmStatus,
    loadInstalledVersions,
    switchVersion,
    uninstallVersion,
  } = useNvm();
  const { setTerminalOpen, addToast } = useUiStore();

  const [uninstallTarget, setUninstallTarget] = useState<string | null>(null);
  const [isUninstalling, setIsUninstalling] = useState(false);
  const [switchingVersion, setSwitchingVersion] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadNvmStatus();
    loadInstalledVersions();
  }, []);

  const handleCopyVersion = () => {
    if (currentVersion?.version) {
      navigator.clipboard.writeText(currentVersion.version);
      setCopied(true);
      addToast({ type: "info", title: "Version copied", duration: 1500 });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSwitch = async (ver: string) => {
    setSwitchingVersion(ver);
    try {
      await switchVersion(ver);
    } finally {
      setSwitchingVersion(null);
    }
  };

  const handleUninstall = async () => {
    if (!uninstallTarget) return;
    setIsUninstalling(true);
    try {
      await uninstallVersion(uninstallTarget);
    } finally {
      setIsUninstalling(false);
      setUninstallTarget(null);
    }
  };

  const ltsCount = installedVersions.filter((v) => v.lts !== false).length;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* NVM Missing Banner */}
      {!isLoadingStatus && nvmStatus && !nvmStatus.installed && (
        <div className="glass-card border-rose-500/30 bg-rose-500/10 p-5 flex items-start gap-4 shadow-modal">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-bold text-text-heading mb-1">
              nvm-windows Environment Required
            </div>
            <p className="text-xs text-text-muted mb-3 leading-relaxed">
              {nvmStatus.error ?? "No active nvm-windows binary was detected in PATH or registry."}
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/coreybutler/nvm-windows/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary btn-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Download nvm-windows
              </a>
              <button
                className="btn-secondary btn-sm"
                onClick={() => { loadNvmStatus(); loadInstalledVersions(); }}
              >
                Retry Detection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Runtime Card */}
      <div className="hero-card p-7">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="section-heading tracking-widest text-brand-400 font-bold">
                Active Runtime Environment
              </span>
              {currentVersion && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 dark:text-emerald-300 text-3xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              )}
            </div>

            {isLoadingVersions ? (
              <div className="flex items-center gap-3 py-4">
                <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
                <span className="text-sm font-medium text-text-muted">Querying Node.js environment...</span>
              </div>
            ) : currentVersion ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="text-4xl md:text-5xl font-black tracking-tight font-mono text-text-heading">
                    {currentVersion.version}
                  </div>
                  <button
                    onClick={handleCopyVersion}
                    className="btn-ghost p-2 rounded-xl text-text-muted hover:text-text-heading"
                    title="Copy version string"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <VersionBadges version={currentVersion} />
                </div>
              </div>
            ) : (
              <div className="py-2 space-y-2">
                <div className="text-sm font-medium text-text-muted">
                  No active Node.js version is currently set.
                </div>
                <button
                  className="btn-primary btn-sm"
                  onClick={() => navigate("/install")}
                >
                  <DownloadCloud className="w-3.5 h-3.5" />
                  Install a Version
                </button>
              </div>
            )}
          </div>

          {/* Quick Details Box */}
          {currentVersion && (
            <div className="flex flex-col gap-3 min-w-[200px] p-4 rounded-2xl bg-bg-card border border-bg-border shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted font-medium">Bundled npm</span>
                <span className="font-mono font-bold text-text-heading">v{currentVersion.npm ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted font-medium">Architecture</span>
                <span className="font-mono font-bold text-text-heading">{currentVersion.arch ?? "x64"}</span>
              </div>
              <div className="pt-2 border-t border-bg-border flex items-center gap-2">
                <button
                  className="btn-secondary btn-sm flex-1 text-2xs"
                  onClick={() => navigate("/versions")}
                >
                  Switch
                </button>
                <button
                  className="btn-ghost btn-sm p-2 text-2xs"
                  onClick={() => setTerminalOpen(true)}
                  title="Open Output Terminal"
                >
                  <TerminalIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Layers}
          label="Installed Releases"
          value={isLoadingVersions ? "..." : installedVersions.length.toString()}
          color="from-indigo-500/15 to-brand-500/5 text-brand-400 border-brand-500/20"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Active LTS"
          value={isLoadingVersions ? "..." : ltsCount.toString()}
          color="from-emerald-500/15 to-teal-500/5 text-emerald-500 dark:text-emerald-400 border-emerald-500/20"
        />
        <MetricCard
          icon={Zap}
          label="Package Manager"
          value={currentVersion?.npm ? `npm v${currentVersion.npm}` : "—"}
          color="from-amber-500/15 to-orange-500/5 text-amber-500 dark:text-amber-400 border-amber-500/20"
        />
        <MetricCard
          icon={DownloadCloud}
          label="Engine Version"
          value={nvmStatus?.installed ? `v${nvmStatus.version}` : "Not found"}
          color="from-sky-500/15 to-blue-500/5 text-sky-500 dark:text-sky-400 border-sky-500/20"
        />
      </div>

      {/* Installed Releases Matrix */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-bg-border">
          <div>
            <h2 className="text-sm font-bold text-text-heading">Installed Node.js Runtimes</h2>
            <p className="text-3xs text-text-muted mt-0.5">Installed versions managed by nvm-windows</p>
          </div>
          <button
            className="btn-ghost btn-sm gap-1 text-brand-400 hover:text-brand-300"
            onClick={() => navigate("/versions")}
          >
            Manage all
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoadingVersions ? (
          <div className="flex items-center justify-center py-16 gap-3 text-text-muted">
            <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
            <span className="text-xs font-medium">Scanning installed directories...</span>
          </div>
        ) : installedVersions.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Layers className="w-10 h-10 text-text-faint mx-auto" />
            <div className="text-sm font-bold text-text-heading">No Node.js versions found</div>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              Download and install Node.js releases directly with one click.
            </p>
            <button className="btn-primary btn-sm mx-auto" onClick={() => navigate("/install")}>
              <DownloadCloud className="w-3.5 h-3.5" />
              Install Release
            </button>
          </div>
        ) : (
          <div className="divide-y divide-bg-border">
            {installedVersions.slice(0, 6).map((ver) => (
              <div
                key={ver.version}
                className={`flex items-center justify-between px-6 py-3.5 hover:bg-bg-hover transition-colors ${
                  ver.active ? "bg-brand-500/5 border-l-2 border-brand-500" : ""
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${ver.active ? "bg-emerald-400 shadow-glow" : "bg-bg-elevated"}`} />
                  <span className="font-mono text-sm font-bold text-text-heading">
                    {ver.version}
                  </span>
                  <VersionBadges version={ver} />
                </div>

                <div className="flex items-center gap-6">
                  {ver.npm && (
                    <div className="hidden sm:block text-2xs font-mono text-text-muted">
                      npm {ver.npm}
                    </div>
                  )}
                  <div className="hidden md:block text-3xs font-mono text-text-faint">
                    {ver.arch ?? "x64"}
                  </div>

                  <div className="flex items-center gap-2">
                    {ver.active ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                        In Use
                      </span>
                    ) : (
                      <button
                        id={`dashboard-use-${ver.version}`}
                        className="btn-secondary btn-xs font-bold"
                        onClick={() => handleSwitch(ver.version)}
                        disabled={switchingVersion === ver.version}
                      >
                        {switchingVersion === ver.version ? (
                          <Loader2 className="w-3 h-3 animate-spin text-brand-500" />
                        ) : null}
                        Use
                      </button>
                    )}

                    {!ver.active && (
                      <button
                        id={`dashboard-uninstall-${ver.version}`}
                        className="btn-ghost btn-xs p-1.5 text-text-faint hover:text-rose-400"
                        onClick={() => setUninstallTarget(ver.version)}
                        title="Uninstall"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!uninstallTarget}
        onClose={() => setUninstallTarget(null)}
        onConfirm={handleUninstall}
        title={`Uninstall Node.js ${uninstallTarget}`}
        message={`This will remove Node.js ${uninstallTarget} from your system disk. This action cannot be undone.`}
        confirmLabel="Uninstall"
        confirmVariant="danger"
        isLoading={isUninstalling}
      />
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className={`glass-card p-4 bg-gradient-to-br ${color} border transition-all hover:scale-[1.02]`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-2xs font-bold text-text-muted uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-extrabold font-mono text-text-heading">{value}</div>
    </div>
  );
}
