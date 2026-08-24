use serde::{Deserialize, Serialize};

/// Represents an installed or available Node.js version
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NodeVersion {
    pub version: String,
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
    /// false or LTS codename string
    pub lts: LtsStatus,
    pub current: bool,
    pub installed: bool,
    pub active: bool,
    pub date: Option<String>,
    pub npm: Option<String>,
    pub openssl: Option<String>,
    pub v8: Option<String>,
    pub modules: Option<String>,
    pub arch: Option<String>,
    pub install_date: Option<String>,
}

/// Available version from nodejs.org/dist/index.json
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AvailableNodeVersion {
    pub version: String,
    pub date: String,
    pub files: Vec<String>,
    pub npm: Option<String>,
    pub v8: String,
    pub uv: Option<String>,
    pub zlib: Option<String>,
    pub openssl: Option<String>,
    pub modules: Option<String>,
    pub lts: LtsStatus,
    pub security: bool,
}

/// LTS status: either false (not LTS) or a codename string
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(untagged)]
pub enum LtsStatus {
    NotLts(bool),   // always false
    Lts(String),    // codename e.g. "Iron"
}

#[allow(dead_code)]
impl LtsStatus {
    pub fn is_lts(&self) -> bool {
        matches!(self, LtsStatus::Lts(_))
    }

    pub fn codename(&self) -> Option<&str> {
        match self {
            LtsStatus::Lts(name) => Some(name),
            LtsStatus::NotLts(_) => None,
        }
    }
}

impl Default for LtsStatus {
    fn default() -> Self {
        LtsStatus::NotLts(false)
    }
}

/// Status of the NVM installation
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NvmStatus {
    pub installed: bool,
    pub version: Option<String>,
    pub nvm_home: Option<String>,
    pub nvm_symlink: Option<String>,
    pub executable_path: Option<String>,
    pub error: Option<String>,
}

/// Result of executing an external command
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandResult {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
    pub duration_ms: u64,
}

/// An activity log entry
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivityEntry {
    pub id: String,
    pub timestamp: String,
    pub operation: String,
    pub command: String,
    pub args: Vec<String>,
    pub result: Option<CommandResult>,
    pub status: ActivityStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ActivityStatus {
    Success,
    Error,
    Running,
    Cancelled,
}

/// Install progress event (emitted via Tauri events)
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallProgress {
    pub version: String,
    pub phase: InstallPhase,
    pub percent_estimate: Option<u8>,
    pub current_line: String,
    pub lines: Vec<String>,
    pub error: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum InstallPhase {
    Downloading,
    Extracting,
    Configuring,
    Done,
    Error,
}

/// App settings
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub general: GeneralSettings,
    pub appearance: AppearanceSettings,
    pub node: NodeSettings,
    pub nvm: NvmSettings,
    pub advanced: AdvancedSettings,
    pub meta: MetaSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GeneralSettings {
    pub launch_on_startup: bool,
    pub check_for_updates: bool,
    pub auto_refresh_versions: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppearanceSettings {
    pub theme: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NodeSettings {
    pub default_version: Option<String>,
    pub auto_refresh_environment: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NvmSettings {
    pub nvm_home: Option<String>,
    pub nvm_symlink: Option<String>,
    pub nvm_executable: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdvancedSettings {
    pub debug_logging: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetaSettings {
    pub first_run: bool,
    pub version: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        AppSettings {
            general: GeneralSettings {
                launch_on_startup: false,
                check_for_updates: true,
                auto_refresh_versions: true,
            },
            appearance: AppearanceSettings {
                theme: "dark".to_string(),
            },
            node: NodeSettings {
                default_version: None,
                auto_refresh_environment: true,
            },
            nvm: NvmSettings {
                nvm_home: None,
                nvm_symlink: None,
                nvm_executable: None,
            },
            advanced: AdvancedSettings {
                debug_logging: false,
            },
            meta: MetaSettings {
                first_run: true,
                version: "1.0.0".to_string(),
            },
        }
    }
}
