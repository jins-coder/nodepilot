/// NVM-Windows detector
///
/// Detects nvm-windows installation using multiple strategies:
/// 1. Environment variables (NVM_HOME, NVM_SYMLINK) from registry
/// 2. Common installation paths
/// 3. PATH search for nvm.exe
/// 4. settings.txt fallback

use std::path::{Path, PathBuf};
use crate::models::NvmStatus;
use crate::utils::process_runner::run_command;

#[cfg(windows)]
use winreg::{enums::*, RegKey};

/// Common nvm-windows installation paths to check
const COMMON_NVM_PATHS: &[&str] = &[
    "C:\\Program Files\\nvm",
    "C:\\Program Files (x86)\\nvm",
    "C:\\nvm",
];

/// Read an environment variable from the Windows registry.
/// Checks Machine scope first, then User scope.
#[cfg(windows)]
fn get_env_from_registry(var_name: &str) -> Option<String> {
    // System-level env vars
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let system_path = r"SYSTEM\CurrentControlSet\Control\Session Manager\Environment";
    if let Ok(env_key) = hklm.open_subkey(system_path) {
        if let Ok(val) = env_key.get_value::<String, _>(var_name) {
            if !val.is_empty() {
                return Some(val);
            }
        }
    }

    // User-level env vars
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    if let Ok(env_key) = hkcu.open_subkey(r"Environment") {
        if let Ok(val) = env_key.get_value::<String, _>(var_name) {
            if !val.is_empty() {
                return Some(val);
            }
        }
    }

    None
}

#[cfg(not(windows))]
fn get_env_from_registry(_var_name: &str) -> Option<String> {
    None
}

/// Expand Windows environment variable references like %USERPROFILE%
fn expand_env_refs(s: &str) -> String {
    // Simple expansion of common variables
    let mut result = s.to_string();
    let vars_to_expand = ["USERPROFILE", "APPDATA", "LOCALAPPDATA", "SystemDrive", "ProgramFiles"];
    for var in &vars_to_expand {
        let key = format!("%{}%", var);
        if result.contains(&key) {
            if let Ok(val) = std::env::var(var) {
                result = result.replace(&key, &val);
            }
        }
    }
    result
}

/// Resolve NVM_HOME: check process env, then registry, then common paths
fn resolve_nvm_home() -> Option<String> {
    // 1. Direct process environment (already loaded)
    if let Ok(val) = std::env::var("NVM_HOME") {
        let expanded = expand_env_refs(&val);
        if Path::new(&expanded).exists() {
            return Some(expanded);
        }
    }

    // 2. Registry (catches vars set by installer but not yet inherited)
    if let Some(val) = get_env_from_registry("NVM_HOME") {
        let expanded = expand_env_refs(&val);
        if Path::new(&expanded).exists() {
            return Some(expanded);
        }
    }

    // 3. Common installation paths — check for nvm.exe existence
    // (also check user-specific AppData paths)
    let mut candidate_paths: Vec<PathBuf> = COMMON_NVM_PATHS.iter().map(PathBuf::from).collect();

    // User AppData paths
    for base_var in &["LOCALAPPDATA", "APPDATA"] {
        if let Ok(base) = std::env::var(base_var) {
            candidate_paths.push(PathBuf::from(&base).join("nvm"));
        }
    }

    for path in &candidate_paths {
        if path.join("nvm.exe").exists() {
            return Some(path.to_string_lossy().to_string());
        }
    }

    // 4. Search PATH for nvm.exe
    if let Ok(path_var) = std::env::var("PATH") {
        for dir in path_var.split(';') {
            let p = PathBuf::from(dir).join("nvm.exe");
            if p.exists() {
                return Some(dir.to_string());
            }
        }
    }

    None
}

/// Resolve NVM_SYMLINK: where the active Node.js symlink points
fn resolve_nvm_symlink() -> Option<String> {
    if let Ok(val) = std::env::var("NVM_SYMLINK") {
        let expanded = expand_env_refs(&val);
        return Some(expanded);
    }

    if let Some(val) = get_env_from_registry("NVM_SYMLINK") {
        let expanded = expand_env_refs(&val);
        return Some(expanded);
    }

    // Try reading from nvm settings.txt
    if let Some(home) = resolve_nvm_home() {
        let settings = PathBuf::from(&home).join("settings.txt");
        if let Ok(content) = std::fs::read_to_string(&settings) {
            for line in content.lines() {
                if let Some(path_part) = line.strip_prefix("path: ") {
                    return Some(path_part.trim().to_string());
                }
            }
        }
    }

    None
}

/// Get NVM version by running nvm.exe version
fn get_nvm_version(nvm_exe: &str, nvm_home: &str, nvm_symlink: &str) -> Option<String> {
    let env_vars = [("NVM_HOME", nvm_home), ("NVM_SYMLINK", nvm_symlink)];
    let result = run_command(nvm_exe, &["version"], &env_vars).ok()?;
    if result.success {
        let version = result.stdout.trim().to_string();
        if !version.is_empty() {
            return Some(version);
        }
    }
    None
}

/// Primary detection function — returns NvmStatus
pub fn detect_nvm() -> NvmStatus {
    let nvm_home = resolve_nvm_home();

    match nvm_home {
        None => NvmStatus {
            installed: false,
            version: None,
            nvm_home: None,
            nvm_symlink: None,
            executable_path: None,
            error: Some("nvm-windows not found. Please install it from https://github.com/coreybutler/nvm-windows/releases".to_string()),
        },
        Some(home) => {
            let exe_path = PathBuf::from(&home).join("nvm.exe");
            let exe_str = exe_path.to_string_lossy().to_string();

            if !exe_path.exists() {
                return NvmStatus {
                    installed: false,
                    version: None,
                    nvm_home: Some(home),
                    nvm_symlink: None,
                    executable_path: None,
                    error: Some("nvm directory found but nvm.exe is missing".to_string()),
                };
            }

            let symlink = resolve_nvm_symlink().unwrap_or_default();
            let version = get_nvm_version(&exe_str, &home, &symlink);

            NvmStatus {
                installed: true,
                version,
                nvm_home: Some(home),
                nvm_symlink: Some(symlink),
                executable_path: Some(exe_str),
                error: None,
            }
        }
    }
}
