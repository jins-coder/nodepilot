import { useEffect, useState } from "react";
import {
  Settings,
  Sun,
  Moon,
  Monitor,
  Save,
  RotateCcw,
  Loader2,
  AlertTriangle,
  FolderOpen,
  Info,
} from "lucide-react";
import { useSettingsStore, useUiStore } from "@/stores";
import { loadSettings, saveSettings, resetSettings } from "@/services/settingsService";
import { ConfirmModal } from "@/components/ui/Modal";
import { applyTheme } from "@/utils/theme";
import type { AppSettings } from "@/types";

export function SettingsPage() {
  const { settings, isLoading, isSaving, setSettings, setSaving, setLoading } = useSettingsStore();
  const { addToast } = useUiStore();
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [showReset, setShowReset] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const s = await loadSettings();
        setSettings(s);
        setLocalSettings(s);
        applyTheme(s.appearance.theme);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleThemeChange = (theme: "dark" | "light" | "system") => {
    update("appearance", "theme", theme);
    applyTheme(theme);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(localSettings);
      setSettings(localSettings);
      applyTheme(localSettings.appearance.theme);
      setSaved(true);
      addToast({
        type: "success",
        title: "Settings saved",
        message: "Preferences updated successfully",
      });
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      addToast({
        type: "error",
        title: "Failed to save settings",
        message: String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      const defaults = await resetSettings();
      setSettings(defaults);
      setLocalSettings(defaults);
      applyTheme(defaults.appearance.theme);
      addToast({
        type: "info",
        title: "Settings reset",
        message: "All settings restored to defaults",
      });
    } catch (err) {
      addToast({
        type: "error",
        title: "Failed to reset settings",
        message: String(err),
      });
    } finally {
      setSaving(false);
      setShowReset(false);
    }
  };

  const update = <K extends keyof AppSettings>(
    section: K,
    key: keyof AppSettings[K],
    value: unknown
  ) => {
    setLocalSettings((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as object),
        [key]: value,
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20 gap-2 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
        <span className="text-sm font-medium">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl space-y-6 animate-fade-in mx-auto">
      {/* General */}
      <SettingsSection title="General" icon={Settings}>
        <Toggle
          id="setting-launch-startup"
          label="Launch NodePilot on startup"
          description="Start NodePilot automatically when Windows starts"
          checked={localSettings.general.launchOnStartup}
          onChange={(v) => update("general", "launchOnStartup", v)}
        />
        <Toggle
          id="setting-check-updates"
          label="Check for updates automatically"
          checked={localSettings.general.checkForUpdates}
          onChange={(v) => update("general", "checkForUpdates", v)}
        />
        <Toggle
          id="setting-auto-refresh"
          label="Automatically refresh Node versions"
          description="Re-detect installed versions on app start"
          checked={localSettings.general.autoRefreshVersions}
          onChange={(v) => update("general", "autoRefreshVersions", v)}
        />
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection title="Appearance" icon={Sun}>
        <div className="space-y-3">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Theme Preference
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(["dark", "light", "system"] as const).map((theme) => {
              const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
              const isSelected = localSettings.appearance.theme === theme;
              return (
                <button
                  key={theme}
                  id={`theme-${theme}`}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold border transition-all capitalize ${
                    isSelected
                      ? "bg-brand-500 text-white border-brand-500 shadow-md font-bold"
                      : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  onClick={() => handleThemeChange(theme)}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
                  <span>{theme}</span>
                </button>
              );
            })}
          </div>
        </div>
      </SettingsSection>

      {/* Node.js */}
      <SettingsSection title="Node.js" icon={Info}>
        <Toggle
          id="setting-auto-refresh-env"
          label="Auto-refresh environment after switching"
          description="Automatically reload NVM status after use/install operations"
          checked={localSettings.node.autoRefreshEnvironment}
          onChange={(v) => update("node", "autoRefreshEnvironment", v)}
        />
      </SettingsSection>

      {/* NVM */}
      <SettingsSection title="NVM Paths" icon={FolderOpen}>
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-3.5 flex items-start gap-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            Leave these blank to use auto-detection. Only specify paths if you have
            a non-standard nvm-windows installation.
          </p>
        </div>
        <div className="space-y-3">
          <PathInput
            id="nvm-home-input"
            label="NVM Home Directory"
            placeholder="C:\Users\User\AppData\Local\nvm"
            value={localSettings.nvm.nvmHome ?? ""}
            onChange={(v) => update("nvm", "nvmHome", v || undefined)}
          />
          <PathInput
            id="nvm-symlink-input"
            label="Node.js Symlink Directory"
            placeholder="C:\nvm4w\nodejs"
            value={localSettings.nvm.nvmSymlink ?? ""}
            onChange={(v) => update("nvm", "nvmSymlink", v || undefined)}
          />
          <PathInput
            id="nvm-exe-input"
            label="NVM Executable Path"
            placeholder="C:\Users\User\AppData\Local\nvm\nvm.exe"
            value={localSettings.nvm.nvmExecutable ?? ""}
            onChange={(v) => update("nvm", "nvmExecutable", v || undefined)}
          />
        </div>
      </SettingsSection>

      {/* Advanced */}
      <SettingsSection title="Advanced" icon={Settings}>
        <Toggle
          id="setting-debug-logging"
          label="Enable debug telemetry"
          description="Log detailed diagnostics in terminal buffer"
          checked={localSettings.advanced.debugLogging}
          onChange={(v) => update("advanced", "debugLogging", v)}
        />
        <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Reset Application Data</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Restore all settings to initial defaults</div>
          </div>
          <button
            id="reset-settings-btn"
            className="btn-danger btn-sm gap-1.5"
            onClick={() => setShowReset(true)}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Data</span>
          </button>
        </div>
      </SettingsSection>

      {/* Save button */}
      <div className="flex items-center gap-3 pt-4">
        <button
          id="save-settings-btn"
          className="btn-primary gap-2"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saved ? "Saved Successfully!" : "Save Settings"}</span>
        </button>
      </div>

      <ConfirmModal
        isOpen={showReset}
        onClose={() => setShowReset(false)}
        onConfirm={handleReset}
        title="Reset Application Data"
        message="This will reset all settings to their defaults. Your installed Node.js versions will not be affected."
        confirmLabel="Reset"
        confirmVariant="danger"
      />
    </div>
  );
}

// ---- Sub-components ----

function SettingsSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#161928] border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm transition-colors">
      <div className="flex items-center gap-2.5 px-6 py-3.5 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1b1f32]">
        <Icon className="w-4 h-4 text-brand-500 dark:text-brand-400" />
        <span className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">{title}</span>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );
}

function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div>
        <div className="text-sm font-bold text-slate-900 dark:text-white">{label}</div>
        {description && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{description}</div>
        )}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 cursor-pointer p-0.5
                    ${checked ? "bg-brand-500" : "bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/10"}`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200
                      ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

function PathInput({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-bold text-slate-800 dark:text-slate-200">
        {label}
      </label>
      <input
        id={id}
        type="text"
        className="w-full px-3.5 py-2 rounded-xl text-xs font-mono bg-slate-50 dark:bg-[#121420] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
