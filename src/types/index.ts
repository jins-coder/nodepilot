// ============================================================
// NodePilot Core Types
// ============================================================

export interface NodeVersion {
  version: string;        // e.g. "v22.14.0"
  major: number;
  minor: number;
  patch: number;
  lts: string | false;    // false or LTS codename e.g. "Iron"
  current: boolean;       // is this the nodejs "Current" release line
  installed: boolean;     // is it installed locally
  active: boolean;        // is this the active version right now
  date?: string;          // release date ISO string
  npm?: string;           // bundled npm version
  openssl?: string;
  v8?: string;
  modules?: string;
  arch?: string;          // "x64" | "arm64" | "x86"
  installDate?: string;   // when we installed it (ISO)
}

export interface AvailableNodeVersion {
  version: string;
  date: string;
  files: string[];
  npm: string;
  v8: string;
  uv: string;
  zlib: string;
  openssl: string;
  modules: string;
  lts: string | false;
  security: boolean;
}

export interface NvmStatus {
  installed: boolean;
  version?: string;
  nvmHome?: string;
  nvmSymlink?: string;
  executablePath?: string;
  error?: string;
}

export interface SystemInfo {
  os: "windows" | "macos" | "linux";
  arch: "x64" | "arm64" | "x86";
  nvmStatus: NvmStatus;
  currentNode?: string;
  currentNpm?: string;
  nodeArch?: string;
}

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

export type ActivityStatus = "success" | "error" | "running" | "cancelled";

export interface ActivityEntry {
  id: string;
  timestamp: string;           // ISO date string
  operation: string;           // human-readable description
  command: string;             // the command executed
  args: string[];              // arguments (never includes secrets)
  result?: CommandResult;
  status: ActivityStatus;
}

export interface InstallProgress {
  version: string;
  phase: "downloading" | "extracting" | "configuring" | "done" | "error";
  percentEstimate?: number;    // rough estimate, not exact bytes
  currentLine: string;         // latest stdout line
  lines: string[];             // all output lines
  error?: string;
}

export interface AppSettings {
  general: {
    launchOnStartup: boolean;
    checkForUpdates: boolean;
    autoRefreshVersions: boolean;
  };
  appearance: {
    theme: "dark" | "light" | "system";
  };
  node: {
    defaultVersion?: string;
    autoRefreshEnvironment: boolean;
  };
  nvm: {
    nvmHome?: string;
    nvmSymlink?: string;
    nvmExecutable?: string;
  };
  advanced: {
    debugLogging: boolean;
  };
  _meta: {
    firstRun: boolean;
    version: string;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  general: {
    launchOnStartup: false,
    checkForUpdates: true,
    autoRefreshVersions: true,
  },
  appearance: {
    theme: "dark",
  },
  node: {
    autoRefreshEnvironment: true,
  },
  nvm: {},
  advanced: {
    debugLogging: false,
  },
  _meta: {
    firstRun: true,
    version: "1.0.0",
  },
};

export type FilterType = "all" | "lts" | "current" | "active";
export type SortType = "newest" | "oldest" | "lts-first";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  duration?: number;
}
