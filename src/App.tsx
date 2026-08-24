import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { NodeVersionsPage } from "@/pages/NodeVersionsPage";
import { InstallNodePage } from "@/pages/InstallNodePage";
import { ActivityPage } from "@/pages/ActivityPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { useNvm } from "@/hooks/useNvm";
import { useSettingsStore } from "@/stores";
import { loadSettings } from "@/services/settingsService";
import { applyTheme } from "@/utils/theme";

export default function App() {
  const { loadNvmStatus, loadInstalledVersions } = useNvm();
  const { setSettings } = useSettingsStore();

  // Load saved settings & apply theme on boot
  useEffect(() => {
    const initSettings = async () => {
      try {
        const s = await loadSettings();
        setSettings(s);
        applyTheme(s.appearance.theme);
      } catch {
        applyTheme("dark");
      }
    };
    initSettings();
  }, [setSettings]);

  // Initial load and continuous sync with Windows environment
  useEffect(() => {
    loadNvmStatus(true);
    loadInstalledVersions(true);

    // Auto-refresh when the window gains focus (e.g. user ran `nvm use` in CMD and clicked back)
    const handleFocus = () => {
      loadInstalledVersions(false);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadInstalledVersions(false);
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    // Subtle 3-second background polling interval for real-time sync
    const interval = setInterval(() => {
      loadInstalledVersions(false);
    }, 3000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
  }, [loadNvmStatus, loadInstalledVersions]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/versions" element={<NodeVersionsPage />} />
        <Route path="/install" element={<InstallNodePage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  );
}
