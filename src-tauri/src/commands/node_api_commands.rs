/// Node.js API commands — fetches available versions from nodejs.org

use crate::models::AvailableNodeVersion;

const NODE_DIST_URL: &str = "https://nodejs.org/dist/index.json";

/// Fetch available Node.js versions from nodejs.org/dist/index.json
/// Uses reqwest with a reasonable timeout. Results are returned to the frontend
/// which handles its own caching via localStorage.
#[tauri::command]
pub async fn fetch_available_versions() -> Result<Vec<AvailableNodeVersion>, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .user_agent("NodePilot/1.0.0")
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    let response = client
        .get(NODE_DIST_URL)
        .send()
        .await
        .map_err(|e| {
            if e.is_timeout() {
                "Request timed out. Please check your internet connection.".to_string()
            } else if e.is_connect() {
                "Unable to connect to nodejs.org. Please check your internet connection.".to_string()
            } else {
                format!("Network error: {}", e)
            }
        })?;

    if !response.status().is_success() {
        return Err(format!(
            "nodejs.org returned HTTP {}: {}",
            response.status().as_u16(),
            response.status().canonical_reason().unwrap_or("Unknown")
        ));
    }

    let versions: Vec<AvailableNodeVersion> = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse version data: {}", e))?;

    Ok(versions)
}
