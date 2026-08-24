import { useCallback } from "react";
import {
  installNodeVersion,
  cancelInstallNode,
  listInstalledVersions,
  getCurrentVersion,
  onInstallProgress,
} from "@/services/nvmService";
import { fetchAvailableVersions } from "@/services/nodeApiService";
import { useInstallStore, useActivityStore, useUiStore, useNvmStore } from "@/stores";
import { appendActivity, createActivityEntry } from "@/services/activityService";
import type { InstallProgress } from "@/types";

export function useInstall() {
  const {
    availableVersions,
    isLoadingAvailable,
    availableError,
    installProgress,
    isInstalling,
    setAvailableVersions,
    setLoadingAvailable,
    setAvailableError,
    setInstallProgress,
    setIsInstalling,
  } = useInstallStore();

  const { setInstalledVersions, setCurrentVersion } = useNvmStore();
  const { addEntry } = useActivityStore();
  const { addToast, appendTerminalLine, setTerminalOpen } = useUiStore();

  const loadAvailableVersions = useCallback(
    async (forceRefresh = false) => {
      setLoadingAvailable(true);
      setAvailableError(null);
      try {
        const versions = await fetchAvailableVersions(forceRefresh);
        setAvailableVersions(versions);
      } catch (err) {
        const message = String(err);
        setAvailableError(message);
        addToast({
          type: "error",
          title: "Failed to fetch versions",
          message,
        });
      } finally {
        setLoadingAvailable(false);
      }
    },
    [setAvailableVersions, setLoadingAvailable, setAvailableError, addToast]
  );

  const cancelInstall = useCallback(async () => {
    try {
      await cancelInstallNode();
      appendTerminalLine(`✗ Installation cancelled by user.`);
      addToast({ type: "info", title: "Installation cancelled", duration: 2000 });
      setIsInstalling(false);
      setInstallProgress(null);
    } catch (err) {
      console.error("Cancel failed:", err);
    }
  }, [appendTerminalLine, addToast, setIsInstalling, setInstallProgress]);

  const install = useCallback(
    async (version: string): Promise<boolean> => {
      const cleanVersion = version.replace(/^v/, "");

      setIsInstalling(true);
      appendTerminalLine(`> nvm install ${cleanVersion}`);

      const collectedLines: string[] = ["Starting installation..."];

      const initialProgress: InstallProgress = {
        version,
        phase: "downloading",
        percentEstimate: 10,
        currentLine: "Starting installation...",
        lines: [...collectedLines],
      };
      setInstallProgress(initialProgress);

      // Set up progress listener
      const unlisten = await onInstallProgress((progress) => {
        if (progress.currentLine && !collectedLines.includes(progress.currentLine)) {
          collectedLines.push(progress.currentLine);
        }
        setInstallProgress({
          ...progress,
          lines: [...collectedLines],
        });
        if (progress.currentLine) {
          appendTerminalLine(progress.currentLine);
        }
      });

      try {
        const result = await installNodeVersion(cleanVersion);

        const entry = createActivityEntry(
          `Installed Node.js v${cleanVersion}`,
          "nvm",
          ["install", cleanVersion],
          result.success ? "success" : "error",
          result
        );
        addEntry(entry);
        await appendActivity(entry);

        if (result.stdout) {
          result.stdout.split("\n").forEach((l) => {
            const trimmed = l.trim();
            if (trimmed && !collectedLines.includes(trimmed)) {
              collectedLines.push(trimmed);
            }
          });
        }

        if (result.success) {
          addToast({
            type: "success",
            title: `Node.js v${cleanVersion} installed successfully`,
          });
          appendTerminalLine(`✓ Process finished successfully.`);
          setInstallProgress({
            version,
            phase: "done",
            percentEstimate: 100,
            currentLine: "Installation complete.",
            lines: [...collectedLines],
          });

          // Refresh the installed versions store immediately
          try {
            const versions = await listInstalledVersions();
            setInstalledVersions(versions);
            const currentVer = await getCurrentVersion();
            setCurrentVersion(currentVer);
          } catch {
            // Ignore refresh error
          }

          return true;
        } else {
          addToast({
            type: "error",
            title: "Installation failed",
            message: result.stderr || result.stdout,
          });
          appendTerminalLine(`✗ Installation failed: ${result.stderr}`);
          setInstallProgress({
            version,
            phase: "error",
            percentEstimate: 0,
            currentLine: "Installation failed.",
            lines: [...collectedLines],
            error: result.stderr || result.stdout || "Installation exited with an error.",
          });
          return false;
        }
      } catch (err) {
        const message = String(err);
        appendTerminalLine(`✗ Error: ${message}`);
        addToast({ type: "error", title: "Installation error", message });
        setInstallProgress({
          version,
          phase: "error",
          percentEstimate: 0,
          currentLine: message,
          lines: [...collectedLines, `Error: ${message}`],
          error: message,
        });
        return false;
      } finally {
        unlisten();
        setIsInstalling(false);
      }
    },
    [
      setIsInstalling,
      setTerminalOpen,
      appendTerminalLine,
      setInstallProgress,
      setInstalledVersions,
      setCurrentVersion,
      addEntry,
      addToast,
    ]
  );

  return {
    availableVersions,
    isLoadingAvailable,
    availableError,
    installProgress,
    isInstalling,
    loadAvailableVersions,
    install,
    cancelInstall,
  };
}
