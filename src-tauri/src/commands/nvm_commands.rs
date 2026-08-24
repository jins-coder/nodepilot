/// NVM Tauri Commands — the IPC bridge between React frontend and Rust backend.
///
/// All commands validate their inputs. Version strings go through version_validator
/// before being passed to any system call.

use tauri::{AppHandle, Emitter};
use crate::models::{NvmStatus, NodeVersion, CommandResult};
use crate::platform::windows::nvm_detector::detect_nvm;
use crate::platform::windows::nvm_service::create_nvm_service;

/// Get NVM installation status
#[tauri::command]
pub async fn get_nvm_status() -> Result<NvmStatus, String> {
    Ok(detect_nvm())
}

/// List all installed Node.js versions
#[tauri::command]
pub async fn list_installed_versions() -> Result<Vec<NodeVersion>, String> {
    let (status, service) = create_nvm_service();

    match service {
        None => Err(status.error.unwrap_or_else(|| "NVM not installed".to_string())),
        Some(svc) => svc.list_installed(),
    }
}

/// Get the currently active Node.js version
#[tauri::command]
pub async fn get_current_version() -> Result<Option<NodeVersion>, String> {
    let (status, service) = create_nvm_service();

    match service {
        None => Err(status.error.unwrap_or_else(|| "NVM not installed".to_string())),
        Some(svc) => svc.get_current_version(),
    }
}

/// Install a Node.js version (with streaming progress events)
#[tauri::command]
pub async fn install_node_version(app: AppHandle, version: String) -> Result<CommandResult, String> {
    let (status, service) = create_nvm_service();

    let svc = service.ok_or_else(|| {
        status.error.unwrap_or_else(|| "NVM not installed".to_string())
    })?;

    let version_clone = version.clone();
    let app_clone = app.clone();
    let mut lines_collected: Vec<String> = Vec::new();

    let result = svc.install_node(&version, |line| {
        lines_collected.push(line.to_string());

        let line_lower = line.to_lowercase();
        let is_complete = line_lower.contains("installation complete") || line_lower.contains("if you want to use");

        // Estimate progress phase from output content
        let phase = if is_complete {
            "done"
        } else if line_lower.contains("downloading") {
            "downloading"
        } else if line_lower.contains("extracting") || line_lower.contains("installing") || line_lower.contains("creating") {
            "extracting"
        } else {
            "downloading"
        };

        let percent = if is_complete {
            Some(100u8)
        } else if line_lower.contains("downloading node") {
            Some(25u8)
        } else if line_lower.contains("extracting node") {
            Some(50u8)
        } else if line_lower.contains("downloading npm") {
            Some(75u8)
        } else if line_lower.contains("installing npm") {
            Some(90u8)
        } else {
            None
        };

        let _ = app_clone.emit("install-progress", serde_json::json!({
            "version": version_clone,
            "phase": phase,
            "percentEstimate": percent,
            "currentLine": line,
        }));
    })?;

    // Emit done event
    let _ = app.emit("install-progress", serde_json::json!({
        "version": version,
        "phase": if result.success { "done" } else { "error" },
        "percentEstimate": if result.success { 100u8 } else { 0u8 },
        "currentLine": if result.success { "Installation complete." } else { &result.stderr },
        "error": if result.success { serde_json::Value::Null } else { serde_json::Value::String(result.stderr.clone()) },
    }));

    Ok(result)
}

/// Cancel an ongoing installation process
#[tauri::command]
pub async fn cancel_install_node() -> Result<(), String> {
    crate::utils::process_runner::kill_active_process();
    Ok(())
}

/// Uninstall a Node.js version
#[tauri::command]
pub async fn uninstall_node_version(version: String) -> Result<CommandResult, String> {
    let (status, service) = create_nvm_service();

    let svc = service.ok_or_else(|| {
        status.error.unwrap_or_else(|| "NVM not installed".to_string())
    })?;

    svc.uninstall_node(&version)
}

/// Switch to a specific Node.js version
#[tauri::command]
pub async fn use_node_version(version: String) -> Result<CommandResult, String> {
    let (status, service) = create_nvm_service();

    let svc = service.ok_or_else(|| {
        status.error.unwrap_or_else(|| "NVM not installed".to_string())
    })?;

    svc.use_node(&version)
}

/// Refresh: re-detect nvm and current version (useful after switching)
#[tauri::command]
pub async fn refresh_environment() -> Result<NvmStatus, String> {
    Ok(detect_nvm())
}
