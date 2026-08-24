import { useEffect, useState, useMemo } from "react";
import {
  Search,
  DownloadCloud,
  RefreshCw,
  Loader2,
  WifiOff,
  CheckCircle2,
  Clock,
  Zap,
  Calendar,
  X,
  AlertCircle,
} from "lucide-react";
import { useInstall } from "@/hooks/useInstall";
import { useNvm } from "@/hooks/useNvm";
import { useNvmStore, useUiStore } from "@/stores";
import { Modal } from "@/components/ui/Modal";
import { getLtsLabel, normalizeVersion } from "@/utils/versions";
import { getCacheAgeMinutes } from "@/services/nodeApiService";
import type { AvailableNodeVersion } from "@/types";

type InstallFilter = "all" | "lts" | "current";

export function InstallNodePage() {
  const {
    availableVersions,
    isLoadingAvailable,
    availableError,
    installProgress,
    isInstalling,
    loadAvailableVersions,
    install,
    cancelInstall,
  } = useInstall();

  const { switchVersion } = useNvm();
  const { installedVersions } = useNvmStore();
  const { installFilter, installSearch, setInstallFilter, setInstallSearch } = useUiStore();

  const [targetVersion, setTargetVersion] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [cacheAge, setCacheAge] = useState<number | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    loadAvailableVersions();
    setCacheAge(getCacheAgeMinutes());
  }, []);

  const installedSet = useMemo(
    () => new Set(installedVersions.map((v) => v.version.replace(/^v/, ""))),
    [installedVersions]
  );

  const filtered = useMemo(() => {
    let versions = availableVersions;

    if (installFilter === "lts") {
      versions = versions.filter((v) => v.lts !== false);
    } else if (installFilter === "current") {
      versions = versions.filter((v) => v.lts === false);
    }

    const q = installSearch.trim().toLowerCase();
    if (q) {
      versions = versions.filter(
        (v) =>
          v.version.toLowerCase().includes(q) ||
          (typeof v.lts === "string" && v.lts.toLowerCase().includes(q))
      );
    }

    return versions.slice(0, 60);
  }, [availableVersions, installFilter, installSearch]);

  const handleInstall = async (version: string) => {
    setTargetVersion(version);
    setShowProgress(true);
    await install(version);
  };

  const handleSwitchAfterInstall = async (version: string) => {
    setIsSwitching(true);
    try {
      await switchVersion(version);
      setShowProgress(false);
      setTargetVersion(null);
    } finally {
      setIsSwitching(false);
    }
  };

  const activeVersionLabel = targetVersion
    ? normalizeVersion(targetVersion)
    : installProgress?.version
    ? normalizeVersion(installProgress.version)
    : "";

  const isSuccess =
    installProgress?.phase === "done" ||
    installProgress?.percentEstimate === 100 ||
    installProgress?.currentLine?.toLowerCase().includes("installation complete") ||
    installProgress?.currentLine?.toLowerCase().includes("if you want to use");

  const isCompleted =
    isSuccess ||
    installProgress?.phase === "error" ||
    (!isInstalling && !!installProgress);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="install-search"
            type="text"
            placeholder="Search version (e.g. 22.14, Iron)..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl text-xs bg-white dark:bg-[#161928] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition-colors"
            value={installSearch}
            onChange={(e) => setInstallSearch(e.target.value)}
          />
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#161928] border border-slate-200 dark:border-white/10">
          {(["all", "lts", "current"] as InstallFilter[]).map((f) => {
            const isActive = installFilter === f;
            return (
              <button
                key={f}
                id={`install-filter-${f}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  isActive
                    ? "bg-brand-500 text-white shadow-sm font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5"
                }`}
                onClick={() => setInstallFilter(f)}
              >
                {f === "all" ? "All Versions" : f === "lts" ? "LTS Only" : "Current Only"}
              </button>
            );
          })}
        </div>

        {/* Refresh & Cache Metadata */}
        <div className="flex items-center gap-3">
          {cacheAge !== null && (
            <span className="hidden md:flex items-center gap-1 text-[10px] font-medium text-slate-400">
              <Clock className="w-3 h-3" />
              Cached {cacheAge}m ago
            </span>
          )}
          <button
            id="refresh-available-btn"
            className="btn-secondary btn-sm gap-1.5"
            onClick={() => {
              loadAvailableVersions(true);
              setCacheAge(null);
            }}
            disabled={isLoadingAvailable}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAvailable ? "animate-spin text-brand-500" : "text-slate-500"}`} />
            <span>Fetch Latest</span>
          </button>
        </div>
      </div>

      {/* Network Error state */}
      {availableError && !isLoadingAvailable && (
        <div className="p-8 text-center space-y-3 rounded-2xl bg-white dark:bg-[#161928] border border-slate-200 dark:border-white/10">
          <WifiOff className="w-10 h-10 text-rose-500 mx-auto" />
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            Unable to connect to nodejs.org
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">{availableError}</p>
          <button
            className="btn-secondary btn-sm mx-auto"
            onClick={() => loadAvailableVersions(true)}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Connection
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoadingAvailable && (
        <div className="flex items-center justify-center py-24 gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          <span className="text-sm font-medium">Fetching official releases index...</span>
        </div>
      )}

      {/* Version Grid */}
      {!isLoadingAvailable && !availableError && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((version) => (
            <VersionCard
              key={version.version}
              version={version}
              isInstalled={installedSet.has(version.version.replace(/^v/, ""))}
              isInstalling={isInstalling && targetVersion === version.version.replace(/^v/, "")}
              onInstall={() => handleInstall(version.version.replace(/^v/, ""))}
              globalInstalling={isInstalling}
            />
          ))}
        </div>
      )}

      {/* Clean Modern Installation Modal */}
      <Modal
        isOpen={showProgress && !!installProgress}
        onClose={() => {
          if (!isCompleted) {
            cancelInstall();
          }
          setShowProgress(false);
          setTargetVersion(null);
        }}
        title={isSuccess ? `Installation Complete` : `Installing Node.js ${activeVersionLabel}`}
        width="md"
      >
        {installProgress && (
          <div className="p-7 space-y-6">
            {/* Status Header */}
            <div className="flex items-center gap-4">
              {isSuccess ? (
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : installProgress.phase === "error" ? (
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-500 shrink-0">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-base font-extrabold text-slate-900 dark:text-white">
                  {isSuccess
                    ? `Node.js ${activeVersionLabel} is Ready!`
                    : installProgress.phase === "error"
                    ? "Installation Failed"
                    : `Installing Node.js ${activeVersionLabel}`}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {isSuccess
                    ? "Binaries extracted and added to your NVM repository."
                    : installProgress.currentLine || "Downloading release packages from nodejs.org..."}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            {installProgress.phase !== "error" && (
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold text-slate-500">
                  <span>{isSuccess ? "Complete" : installProgress.phase === "extracting" ? "Extracting..." : "Downloading..."}</span>
                  <span>{isSuccess ? "100%" : `${installProgress.percentEstimate ?? 45}%`}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden border border-slate-200 dark:border-white/10">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      isSuccess
                        ? "bg-emerald-500"
                        : "bg-gradient-to-r from-brand-500 via-indigo-500 to-sky-400"
                    }`}
                    style={{
                      width: `${isSuccess ? 100 : installProgress.percentEstimate ?? 45}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Error message */}
            {installProgress.error && (
              <div className="text-xs text-rose-600 dark:text-rose-300 bg-rose-500/10 border border-rose-500/25 rounded-xl p-3.5 leading-relaxed">
                {installProgress.error}
              </div>
            )}

            {/* Action Footer */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
              {!isCompleted ? (
                <>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
                    <span>Processing in background...</span>
                  </div>
                  <button
                    id="install-cancel-btn"
                    className="btn-danger btn-sm gap-1.5 font-bold"
                    onClick={() => {
                      cancelInstall();
                      setShowProgress(false);
                      setTargetVersion(null);
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel Installation</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-end gap-3 w-full">
                  <button
                    id="install-done-close-btn"
                    className="btn-secondary btn-sm"
                    onClick={() => {
                      setShowProgress(false);
                      setTargetVersion(null);
                    }}
                  >
                    Close
                  </button>
                  {isSuccess && (
                    <button
                      id="install-use-now-btn"
                      className="btn-primary btn-sm gap-2 font-bold px-4 py-2"
                      onClick={() => handleSwitchAfterInstall(activeVersionLabel)}
                      disabled={isSwitching}
                    >
                      {isSwitching ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5" />
                      )}
                      <span>Use {activeVersionLabel} Now</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

interface VersionCardProps {
  version: AvailableNodeVersion;
  isInstalled: boolean;
  isInstalling: boolean;
  onInstall: () => void;
  globalInstalling: boolean;
}

function VersionCard({
  version,
  isInstalled,
  isInstalling,
  onInstall,
  globalInstalling,
}: VersionCardProps) {
  const ltsLabel = getLtsLabel(version.lts as string | false);
  const isLts = !!ltsLabel;
  const versionNum = version.version.replace(/^v/, "");

  return (
    <div
      className={`rounded-2xl p-5 flex flex-col justify-between gap-4 border transition-all bg-white dark:bg-[#161928] ${
        isLts
          ? "border-emerald-500/25 bg-gradient-to-b from-emerald-500/[0.04] to-white dark:to-[#161928]"
          : "border-slate-200 dark:border-white/10"
      }`}
    >
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="font-mono text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            Node.js {version.version}
          </div>
          <div className="flex items-center gap-1.5">
            {/* LTS Pill */}
            {isLts && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                LTS · {ltsLabel}
              </span>
            )}

            {/* Current Pill */}
            {!isLts && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400" />
                Current
              </span>
            )}

            {/* Installed Pill */}
            {isInstalled && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/25">
                <CheckCircle2 className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                Installed
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            {new Date(version.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </span>
          {version.npm && <span>npm v{version.npm}</span>}
        </div>
      </div>

      {isInstalled ? (
        <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Already Installed</span>
        </div>
      ) : (
        <button
          id={`install-${versionNum}`}
          className="btn-primary btn-sm w-full gap-2 font-bold shadow-md hover:shadow-lg"
          onClick={onInstall}
          disabled={isInstalling || globalInstalling}
        >
          {isInstalling ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Downloading...</span>
            </>
          ) : (
            <>
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>Install Release</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
