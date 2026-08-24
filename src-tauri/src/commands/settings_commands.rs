/// Settings commands — read/write app settings to disk

use tauri::Manager;
use crate::models::AppSettings;

fn get_settings_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Cannot resolve app data dir: {}", e))?;

    std::fs::create_dir_all(&data_dir)
        .map_err(|e| format!("Cannot create app data dir: {}", e))?;

    Ok(data_dir.join("settings.json"))
}

/// Load settings from disk. Returns defaults if file doesn't exist.
#[tauri::command]
pub async fn load_settings(app: tauri::AppHandle) -> Result<AppSettings, String> {
    let path = get_settings_path(&app)?;

    if !path.exists() {
        return Ok(AppSettings::default());
    }

    let content = std::fs::read_to_string(&path)
        .map_err(|e| format!("Cannot read settings: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Invalid settings file: {}", e))
}

/// Save settings to disk
#[tauri::command]
pub async fn save_settings(app: tauri::AppHandle, settings: AppSettings) -> Result<(), String> {
    let path = get_settings_path(&app)?;

    let content = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Cannot serialize settings: {}", e))?;

    std::fs::write(&path, content)
        .map_err(|e| format!("Cannot write settings: {}", e))?;

    Ok(())
}

/// Reset settings to defaults
#[tauri::command]
pub async fn reset_settings(app: tauri::AppHandle) -> Result<AppSettings, String> {
    let defaults = AppSettings::default();
    let path = get_settings_path(&app)?;

    let content = serde_json::to_string_pretty(&defaults)
        .map_err(|e| format!("Cannot serialize defaults: {}", e))?;

    std::fs::write(&path, content)
        .map_err(|e| format!("Cannot write settings: {}", e))?;

    Ok(defaults)
}
