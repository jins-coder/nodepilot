import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type {
  NvmStatus,
  NodeVersion,
  CommandResult,
  InstallProgress,
} from "@/types";

/** Get NVM installation status */
export async function getNvmStatus(): Promise<NvmStatus> {
  return invoke<NvmStatus>("get_nvm_status");
}

/** List all installed Node.js versions */
export async function listInstalledVersions(): Promise<NodeVersion[]> {
  return invoke<NodeVersion[]>("list_installed_versions");
}

/** Get the currently active Node.js version */
export async function getCurrentVersion(): Promise<NodeVersion | null> {
  return invoke<NodeVersion | null>("get_current_version");
}

/** Install a Node.js version (progress via event listener) */
export async function installNodeVersion(version: string): Promise<CommandResult> {
  return invoke<CommandResult>("install_node_version", { version });
}

/** Cancel ongoing Node.js installation */
export async function cancelInstallNode(): Promise<void> {
  return invoke<void>("cancel_install_node");
}

/** Uninstall a Node.js version */
export async function uninstallNodeVersion(version: string): Promise<CommandResult> {
  return invoke<CommandResult>("uninstall_node_version", { version });
}

/** Switch to a Node.js version */
export async function useNodeVersion(version: string): Promise<CommandResult> {
  return invoke<CommandResult>("use_node_version", { version });
}

/** Refresh environment (re-detect nvm + current version) */
export async function refreshEnvironment(): Promise<NvmStatus> {
  return invoke<NvmStatus>("refresh_environment");
}

/** Listen to install progress events */
export function onInstallProgress(
  callback: (progress: InstallProgress) => void
) {
  return listen<InstallProgress>("install-progress", (event) => {
    callback(event.payload);
  });
}
