// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod models;
mod platform;
mod utils;

use commands::nvm_commands::*;
use commands::node_api_commands::*;
use commands::settings_commands::*;
use commands::activity_commands::*;

fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("warn")),
        )
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            // NVM commands
            get_nvm_status,
            list_installed_versions,
            get_current_version,
            install_node_version,
            cancel_install_node,
            uninstall_node_version,
            use_node_version,
            refresh_environment,
            // Node.js API
            fetch_available_versions,
            // Settings
            load_settings,
            save_settings,
            reset_settings,
            // Activity
            load_activity,
            append_activity,
            clear_activity,
        ])
        .run(tauri::generate_context!())
        .expect("error while running NodePilot");
}
