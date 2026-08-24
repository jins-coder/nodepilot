import { invoke } from "@tauri-apps/api/core";
import type { AvailableNodeVersion } from "@/types";

const CACHE_KEY = "nodepilot:node-versions-cache";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface VersionCache {
  timestamp: number;
  versions: AvailableNodeVersion[];
}

/** Fetch available Node.js versions, using localStorage cache */
export async function fetchAvailableVersions(
  forceRefresh = false
): Promise<AvailableNodeVersion[]> {
  if (!forceRefresh) {
    const cached = getCachedVersions();
    if (cached) return cached;
  }

  const versions = await invoke<AvailableNodeVersion[]>("fetch_available_versions");

  // Cache the result
  const cache: VersionCache = {
    timestamp: Date.now(),
    versions,
  };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage might be full; ignore
  }

  return versions;
}

function getCachedVersions(): AvailableNodeVersion[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const cache = JSON.parse(raw) as VersionCache;
    if (Date.now() - cache.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return cache.versions;
  } catch {
    return null;
  }
}

/** Clear cached versions */
export function clearVersionCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

/** Get cache age in minutes, or null if no cache */
export function getCacheAgeMinutes(): number | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as VersionCache;
    return Math.floor((Date.now() - cache.timestamp) / 60000);
  } catch {
    return null;
  }
}
