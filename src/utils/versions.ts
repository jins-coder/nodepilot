import type { NodeVersion, AvailableNodeVersion, FilterType, SortType } from "@/types";

/** Parse semver string, returns null if invalid */
export function parseVersion(version: string): { major: number; minor: number; patch: number } | null {
  const match = version.replace(/^v/, "").match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/** Compare two version strings. Returns negative if a < b, positive if a > b */
export function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) return 0;
  if (pa.major !== pb.major) return pa.major - pb.major;
  if (pa.minor !== pb.minor) return pa.minor - pb.minor;
  return pa.patch - pb.patch;
}

/** Sort installed versions */
export function sortVersions(versions: NodeVersion[], sort: SortType): NodeVersion[] {
  const sorted = [...versions];
  switch (sort) {
    case "newest":
      return sorted.sort((a, b) => compareVersions(b.version, a.version));
    case "oldest":
      return sorted.sort((a, b) => compareVersions(a.version, b.version));
    case "lts-first":
      return sorted.sort((a, b) => {
        if (a.lts !== false && b.lts === false) return -1;
        if (a.lts === false && b.lts !== false) return 1;
        return compareVersions(b.version, a.version);
      });
    default:
      return sorted;
  }
}

/** Filter installed versions */
export function filterVersions(
  versions: NodeVersion[],
  filter: FilterType,
  search: string
): NodeVersion[] {
  let filtered = versions;

  switch (filter) {
    case "lts":
      filtered = filtered.filter((v) => v.lts !== false);
      break;
    case "current":
      filtered = filtered.filter((v) => v.current);
      break;
    case "active":
      filtered = filtered.filter((v) => v.active);
      break;
  }

  if (search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (v) =>
        v.version.toLowerCase().includes(q) ||
        (typeof v.lts === "string" && v.lts.toLowerCase().includes(q))
    );
  }

  return filtered;
}

/** Format relative time */
export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/** Format timestamp to HH:mm */
export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Enrich installed versions with LTS data from available list */
export function enrichWithLtsData(
  installed: NodeVersion[],
  available: AvailableNodeVersion[]
): NodeVersion[] {
  const availableMap = new Map<string, AvailableNodeVersion>();
  for (const av of available) {
    availableMap.set(av.version.replace(/^v/, ""), av);
  }

  return installed.map((v) => {
    const key = v.version.replace(/^v/, "");
    const avData = availableMap.get(key);
    if (avData) {
      return {
        ...v,
        lts: avData.lts,
        current: avData.lts === false && avData.files.length > 0,
        npm: v.npm ?? avData.npm ?? undefined,
        date: avData.date,
      };
    }
    return v;
  });
}

/** Get LTS codename from lts field */
export function getLtsLabel(lts: string | false): string | null {
  if (!lts) return null;
  return lts as string;
}

/** Validate a version string (client-side, mirrors Rust validation) */
export function isValidVersion(version: string): boolean {
  return /^v?\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(version.trim());
}

/** Normalize version: ensure 'v' prefix */
export function normalizeVersion(version: string): string {
  const v = version.trim();
  return v.startsWith("v") ? v : `v${v}`;
}

/** Strip 'v' prefix */
export function stripV(version: string): string {
  return version.replace(/^v/, "");
}

/** Get major version number */
export function getMajorVersion(version: string): number {
  const parsed = parseVersion(version);
  return parsed?.major ?? 0;
}
