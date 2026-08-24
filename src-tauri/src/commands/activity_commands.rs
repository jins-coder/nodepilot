/// Activity log commands — persist operation history

use tauri::Manager;
use crate::models::ActivityEntry;

fn get_activity_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Cannot resolve app data dir: {}", e))?;

    std::fs::create_dir_all(&data_dir)
        .map_err(|e| format!("Cannot create app data dir: {}", e))?;

    Ok(data_dir.join("activity.json"))
}

/// Load activity log from disk
#[tauri::command]
pub async fn load_activity(app: tauri::AppHandle) -> Result<Vec<ActivityEntry>, String> {
    let path = get_activity_path(&app)?;

    if !path.exists() {
        return Ok(Vec::new());
    }

    let content = std::fs::read_to_string(&path)
        .map_err(|e| format!("Cannot read activity log: {}", e))?;

    Ok(serde_json::from_str(&content).unwrap_or_default())
}

/// Append an activity entry
#[tauri::command]
pub async fn append_activity(app: tauri::AppHandle, entry: ActivityEntry) -> Result<(), String> {
    let path = get_activity_path(&app)?;

    let mut entries: Vec<ActivityEntry> = if path.exists() {
        let content = std::fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        Vec::new()
    };

    entries.push(entry);

    // Keep only last 500 entries
    if entries.len() > 500 {
        let drain_count = entries.len() - 500;
        entries.drain(0..drain_count);
    }

    let content = serde_json::to_string_pretty(&entries)
        .map_err(|e| format!("Cannot serialize activity: {}", e))?;

    std::fs::write(&path, content)
        .map_err(|e| format!("Cannot write activity log: {}", e))?;

    Ok(())
}

/// Clear all activity entries
#[tauri::command]
pub async fn clear_activity(app: tauri::AppHandle) -> Result<(), String> {
    let path = get_activity_path(&app)?;

    std::fs::write(&path, "[]")
        .map_err(|e| format!("Cannot clear activity: {}", e))?;

    Ok(())
}
