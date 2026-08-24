import { useEffect, useState } from "react";
import {
  Search,
  Layers,
  Loader2,
  Trash2,
  CheckCircle2,
  ArrowUpDown,
  Zap,
} from "lucide-react";
import { useNvm } from "@/hooks/useNvm";
import { useUiStore } from "@/stores";
import { VersionBadges } from "@/components/ui/VersionBadges";
import { ConfirmModal } from "@/components/ui/Modal";
import { filterVersions, sortVersions } from "@/utils/versions";
import type { FilterType, SortType, NodeVersion } from "@/types";

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All Releases" },
  { value: "active", label: "Active" },
  { value: "lts", label: "LTS Releases" },
  { value: "current", label: "Current" },
];

const SORTS: { value: SortType; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "lts-first", label: "LTS First" },
];

export function NodeVersionsPage() {
  const {
    installedVersions,
    isLoadingVersions,
    loadInstalledVersions,
    switchVersion,
    uninstallVersion,
  } = useNvm();

  const {
    versionsFilter,
    versionsSort,
    versionsSearch,
    setVersionsFilter,
    setVersionsSort,
    setVersionsSearch,
  } = useUiStore();

  const [uninstallTarget, setUninstallTarget] = useState<NodeVersion | null>(null);
  const [isUninstalling, setIsUninstalling] = useState(false);
  const [switchingVersion, setSwitchingVersion] = useState<string | null>(null);

  useEffect(() => {
    loadInstalledVersions();
  }, []);

  const filtered = filterVersions(
    sortVersions(installedVersions, versionsSort),
    versionsFilter,
    versionsSearch
  );

  const handleSwitch = async (version: NodeVersion) => {
    setSwitchingVersion(version.version);
    try {
      await switchVersion(version.version);
    } finally {
      setSwitchingVersion(null);
    }
  };

  const handleUninstall = async () => {
    if (!uninstallTarget) return;
    setIsUninstalling(true);
    try {
      await uninstallVersion(uninstallTarget.version);
    } finally {
      setIsUninstalling(false);
      setUninstallTarget(null);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            id="versions-search"
            type="text"
            placeholder="Search installed releases..."
            className="input pl-10"
            value={versionsSearch}
            onChange={(e) => setVersionsSearch(e.target.value)}
          />
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-card border border-bg-border">
          {FILTERS.map((f) => {
            const isActive = versionsFilter === f.value;
            return (
              <button
                key={f.value}
                id={`filter-${f.value}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-text-muted hover:text-text-heading hover:bg-bg-hover"
                }`}
                onClick={() => setVersionsFilter(f.value)}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-text-faint" />
          <select
            id="versions-sort"
            className="input py-1.5 text-xs font-semibold cursor-pointer w-auto"
            value={versionsSort}
            onChange={(e) => setVersionsSort(e.target.value as SortType)}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {isLoadingVersions ? (
        <div className="flex items-center justify-center py-24 gap-3 text-text-muted">
          <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
          <span className="text-sm font-medium">Scanning Node.js releases...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card py-20 text-center space-y-3">
          <Layers className="w-12 h-12 text-text-faint mx-auto" />
          <div className="text-base font-bold text-text-heading">No matching releases</div>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            {versionsSearch || versionsFilter !== "all"
              ? "Try adjusting your search filters or terms."
              : "No Node.js versions installed yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((version) => (
            <div
              key={version.version}
              className={`glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                version.active
                  ? "border-brand-500/50 bg-gradient-to-r from-brand-500/10 via-bg-card to-bg-card shadow-glow"
                  : "hover:border-bg-border-strong hover:bg-bg-elevated"
              }`}
            >
              {/* Info Column */}
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={`w-3 h-3 rounded-full shrink-0 ${
                    version.active
                      ? "bg-emerald-400 shadow-glow"
                      : "bg-bg-elevated border border-white/10"
                  }`}
                />
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-extrabold text-text-heading">
                      {version.version}
                    </span>
                    <VersionBadges version={version} />
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-2xs text-text-muted font-mono">
                    {version.npm && <span>npm v{version.npm}</span>}
                    <span>{version.arch ?? "x64"}</span>
                  </div>
                </div>
              </div>

              {/* Actions Column */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {version.active ? (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active Symlink</span>
                  </div>
                ) : (
                  <button
                    id={`use-version-${version.version}`}
                    className="btn-secondary btn-sm gap-1.5"
                    onClick={() => handleSwitch(version)}
                    disabled={switchingVersion === version.version}
                  >
                    {switchingVersion === version.version ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-brand-400" />
                    )}
                    <span>Use Version</span>
                  </button>
                )}

                {!version.active && (
                  <button
                    id={`uninstall-${version.version}`}
                    className="btn-danger btn-sm p-2"
                    onClick={() => setUninstallTarget(version)}
                    title="Uninstall release"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uninstall confirm */}
      <ConfirmModal
        isOpen={!!uninstallTarget}
        onClose={() => setUninstallTarget(null)}
        onConfirm={handleUninstall}
        title={`Uninstall Node.js ${uninstallTarget?.version ?? ""}`}
        message={`This will remove Node.js ${uninstallTarget?.version ?? ""} from your system disk. This action cannot be undone.`}
        confirmLabel="Uninstall"
        confirmVariant="danger"
        isLoading={isUninstalling}
      />
    </div>
  );
}
