import { create } from "zustand";
import type {
  NvmStatus,
  NodeVersion,
  AvailableNodeVersion,
  InstallProgress,
  ActivityEntry,
  AppSettings,
  ToastMessage,
  FilterType,
  SortType,
} from "@/types";
import { DEFAULT_SETTINGS } from "@/types";

// ============================================================
// NVM / Node Versions Store
// ============================================================
interface NvmStore {
  nvmStatus: NvmStatus | null;
  installedVersions: NodeVersion[];
  currentVersion: NodeVersion | null;
  isLoadingStatus: boolean;
  isLoadingVersions: boolean;
  lastRefreshed: Date | null;

  setNvmStatus: (status: NvmStatus) => void;
  setInstalledVersions: (versions: NodeVersion[]) => void;
  setCurrentVersion: (version: NodeVersion | null) => void;
  setLoadingStatus: (loading: boolean) => void;
  setLoadingVersions: (loading: boolean) => void;
  setLastRefreshed: (date: Date) => void;
  setActiveVersionOptimistic: (version: string) => void;
  removeInstalledVersion: (version: string) => void;
}

export const useNvmStore = create<NvmStore>((set) => ({
  nvmStatus: null,
  installedVersions: [],
  currentVersion: null,
  isLoadingStatus: false,
  isLoadingVersions: false,
  lastRefreshed: null,

  setNvmStatus: (status) => set({ nvmStatus: status }),
  setInstalledVersions: (versions) => set({ installedVersions: versions }),
  setCurrentVersion: (version) => set({ currentVersion: version }),
  setLoadingStatus: (loading) => set({ isLoadingStatus: loading }),
  setLoadingVersions: (loading) => set({ isLoadingVersions: loading }),
  setLastRefreshed: (date) => set({ lastRefreshed: date }),
  setActiveVersionOptimistic: (version) =>
    set((state) => {
      const clean = version.replace(/^v/, "");
      const full = `v${clean}`;
      let targetVersion: NodeVersion | null = null;

      const updated = state.installedVersions.map((v) => {
        const isMatch = v.version === full || v.version === clean || v.version.endsWith(clean);
        if (isMatch) {
          targetVersion = { ...v, active: true };
          return targetVersion;
        }
        return { ...v, active: false };
      });

      return {
        installedVersions: updated,
        currentVersion: targetVersion ?? state.currentVersion,
      };
    }),
  removeInstalledVersion: (version) =>
    set((state) => ({
      installedVersions: state.installedVersions.filter(
        (v) => v.version !== version && !v.version.endsWith(version)
      ),
    })),
}));

// ============================================================
// Install Store
// ============================================================
interface InstallStore {
  availableVersions: AvailableNodeVersion[];
  isLoadingAvailable: boolean;
  availableError: string | null;
  installProgress: InstallProgress | null;
  isInstalling: boolean;

  setAvailableVersions: (versions: AvailableNodeVersion[]) => void;
  setLoadingAvailable: (loading: boolean) => void;
  setAvailableError: (error: string | null) => void;
  setInstallProgress: (progress: InstallProgress | null) => void;
  setIsInstalling: (installing: boolean) => void;
}

export const useInstallStore = create<InstallStore>((set) => ({
  availableVersions: [],
  isLoadingAvailable: false,
  availableError: null,
  installProgress: null,
  isInstalling: false,

  setAvailableVersions: (versions) => set({ availableVersions: versions }),
  setLoadingAvailable: (loading) => set({ isLoadingAvailable: loading }),
  setAvailableError: (error) => set({ availableError: error }),
  setInstallProgress: (progress) => set({ installProgress: progress }),
  setIsInstalling: (installing) => set({ isInstalling: installing }),
}));

// ============================================================
// Activity Store
// ============================================================
interface ActivityStore {
  entries: ActivityEntry[];
  isLoading: boolean;

  setEntries: (entries: ActivityEntry[]) => void;
  addEntry: (entry: ActivityEntry) => void;
  setLoading: (loading: boolean) => void;
  clearEntries: () => void;
}

export const useActivityStore = create<ActivityStore>((set) => ({
  entries: [],
  isLoading: false,

  setEntries: (entries) => set({ entries }),
  addEntry: (entry) =>
    set((state) => ({
      entries: [entry, ...state.entries.slice(0, 499)],
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  clearEntries: () => set({ entries: [] }),
}));

// ============================================================
// Settings Store
// ============================================================
interface SettingsStore {
  settings: AppSettings;
  isLoading: boolean;
  isSaving: boolean;

  setSettings: (settings: AppSettings) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  isSaving: false,

  setSettings: (settings) => set({ settings }),
  setLoading: (loading) => set({ isLoading: loading }),
  setSaving: (saving) => set({ isSaving: saving }),
}));

// ============================================================
// UI Store
// ============================================================
interface UiStore {
  terminalOpen: boolean;
  terminalLines: string[];
  toasts: ToastMessage[];
  versionsFilter: FilterType;
  versionsSort: SortType;
  versionsSearch: string;
  installFilter: "all" | "lts" | "current";
  installSearch: string;

  setTerminalOpen: (open: boolean) => void;
  appendTerminalLine: (line: string) => void;
  clearTerminalLines: () => void;
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
  setVersionsFilter: (filter: FilterType) => void;
  setVersionsSort: (sort: SortType) => void;
  setVersionsSearch: (search: string) => void;
  setInstallFilter: (filter: "all" | "lts" | "current") => void;
  setInstallSearch: (search: string) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  terminalOpen: false,
  terminalLines: [],
  toasts: [],
  versionsFilter: "all",
  versionsSort: "newest",
  versionsSearch: "",
  installFilter: "all",
  installSearch: "",

  setTerminalOpen: (open) => set({ terminalOpen: open }),
  appendTerminalLine: (line) =>
    set((state) => ({
      terminalLines: [...state.terminalLines, line].slice(-1000),
    })),
  clearTerminalLines: () => set({ terminalLines: [] }),
  addToast: (toast) => {
    const id = crypto.randomUUID();
    const newToast: ToastMessage = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    const duration = toast.duration ?? 4000;
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  setVersionsFilter: (filter) => set({ versionsFilter: filter }),
  setVersionsSort: (sort) => set({ versionsSort: sort }),
  setVersionsSearch: (search) => set({ versionsSearch: search }),
  setInstallFilter: (filter) => set({ installFilter: filter }),
  setInstallSearch: (search) => set({ installSearch: search }),
}));
