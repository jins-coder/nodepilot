import { useCallback } from "react";
import {
  getNvmStatus,
  listInstalledVersions,
  getCurrentVersion,
  useNodeVersion,
  uninstallNodeVersion,
} from "@/services/nvmService";
import {
  useNvmStore,
  useActivityStore,
  useUiStore,
} from "@/stores";
import { appendActivity, createActivityEntry } from "@/services/activityService";

export function useNvm() {
  const {
    nvmStatus,
    installedVersions,
    currentVersion,
    isLoadingStatus,
    isLoadingVersions,
    lastRefreshed,
    setNvmStatus,
    setInstalledVersions,
    setCurrentVersion,
    setLoadingStatus,
    setLoadingVersions,
    setLastRefreshed,
    setActiveVersionOptimistic,
    removeInstalledVersion,
  } = useNvmStore();

  const { addEntry } = useActivityStore();
  const { addToast, appendTerminalLine } = useUiStore();

  const loadNvmStatus = useCallback(async (showLoading = true) => {
    if (showLoading) setLoadingStatus(true);
    try {
      const status = await getNvmStatus();
      setNvmStatus(status);
    } catch (err) {
      setNvmStatus({
        installed: false,
        error: String(err),
      });
    } finally {
      if (showLoading) setLoadingStatus(false);
    }
  }, [setNvmStatus, setLoadingStatus]);

  const loadInstalledVersions = useCallback(async (showLoading = true) => {
    if (showLoading) setLoadingVersions(true);
    try {
      const versions = await listInstalledVersions();
      const currentVer = await getCurrentVersion();
      setCurrentVersion(currentVer);
      setInstalledVersions(versions);
      setLastRefreshed(new Date());
    } catch (err) {
      if (showLoading) {
        addToast({
          type: "error",
          title: "Failed to load versions",
          message: String(err),
        });
      }
    } finally {
      if (showLoading) setLoadingVersions(false);
    }
  }, [setLoadingVersions, setInstalledVersions, setCurrentVersion, setLastRefreshed, addToast]);

  const switchVersion = useCallback(
    async (version: string) => {
      const cleanVersion = version.replace(/^v/, "");
      const previousInstalled = [...installedVersions];
      const previousCurrent = currentVersion ? { ...currentVersion } : null;

      // 1. Instant 0ms Optimistic UI Update
      setActiveVersionOptimistic(cleanVersion);
      appendTerminalLine(`> nvm use ${cleanVersion}`);

      try {
        const result = await useNodeVersion(cleanVersion);
        appendTerminalLine(result.stdout || "");
        if (result.stderr) appendTerminalLine(`[stderr] ${result.stderr}`);

        const entry = createActivityEntry(
          `Switched to Node.js ${version}`,
          "nvm",
          ["use", cleanVersion],
          result.success ? "success" : "error",
          result
        );
        addEntry(entry);
        await appendActivity(entry);

        if (result.success) {
          addToast({ type: "success", title: `Switched to Node.js ${version}`, duration: 2000 });
          appendTerminalLine(`✓ Process finished successfully.`);
          // Background sync
          loadInstalledVersions(false);
        } else {
          // Revert optimistic update on failure
          setInstalledVersions(previousInstalled);
          setCurrentVersion(previousCurrent);
          addToast({
            type: "error",
            title: "Failed to switch version",
            message: result.stderr || result.stdout,
          });
        }

        return result;
      } catch (err) {
        // Revert optimistic update on error
        setInstalledVersions(previousInstalled);
        setCurrentVersion(previousCurrent);
        const message = String(err);
        appendTerminalLine(`✗ Error: ${message}`);
        addToast({ type: "error", title: "Error", message });

        const entry = createActivityEntry(
          `Switch to Node.js ${version} (failed)`,
          "nvm",
          ["use", cleanVersion],
          "error"
        );
        addEntry(entry);
        await appendActivity(entry);

        throw err;
      }
    },
    [
      installedVersions,
      currentVersion,
      setActiveVersionOptimistic,
      appendTerminalLine,
      addEntry,
      addToast,
      setInstalledVersions,
      setCurrentVersion,
      loadInstalledVersions,
    ]
  );

  const uninstallVersion = useCallback(
    async (version: string) => {
      const cleanVersion = version.replace(/^v/, "");
      appendTerminalLine(`> nvm uninstall ${cleanVersion}`);

      try {
        const result = await uninstallNodeVersion(cleanVersion);
        appendTerminalLine(result.stdout || "");

        const entry = createActivityEntry(
          `Uninstalled Node.js ${version}`,
          "nvm",
          ["uninstall", cleanVersion],
          result.success ? "success" : "error",
          result
        );
        addEntry(entry);
        await appendActivity(entry);

        if (result.success) {
          addToast({ type: "success", title: `Uninstalled Node.js ${version}`, duration: 2000 });
          appendTerminalLine(`✓ Process finished successfully.`);
          removeInstalledVersion(version);
          loadInstalledVersions(false);
        } else {
          addToast({
            type: "error",
            title: "Failed to uninstall",
            message: result.stderr || result.stdout,
          });
        }

        return result;
      } catch (err) {
        const message = String(err);
        appendTerminalLine(`✗ Error: ${message}`);
        addToast({ type: "error", title: "Uninstall failed", message });
        throw err;
      }
    },
    [appendTerminalLine, addEntry, addToast, removeInstalledVersion, loadInstalledVersions]
  );

  const refresh = useCallback(async () => {
    await loadNvmStatus(true);
    await loadInstalledVersions(true);
    addToast({ type: "info", title: "Environment refreshed", duration: 1500 });
  }, [loadNvmStatus, loadInstalledVersions, addToast]);

  return {
    nvmStatus,
    installedVersions,
    currentVersion,
    isLoadingStatus,
    isLoadingVersions,
    lastRefreshed,
    loadNvmStatus,
    loadInstalledVersions,
    switchVersion,
    uninstallVersion,
    refresh,
  };
}
