/// NodeVersionManager trait — platform abstraction for managing Node.js versions.
/// 
/// Implement this trait to add support for new platforms (macOS nvm, Linux nvm, etc.)
/// The Windows implementation is NvmWindowsService.

use crate::models::{CommandResult, NodeVersion, NvmStatus};

pub trait NodeVersionManager: Send + Sync {
    /// Get NVM installation status
    fn get_status(&self) -> NvmStatus;

    /// List all installed Node.js versions
    fn list_installed(&self) -> Result<Vec<NodeVersion>, String>;

    /// Get the currently active version
    fn get_current(&self) -> Result<Option<NodeVersion>, String>;

    /// Install a specific version (version must be validated before calling)
    fn install(&self, version: &str) -> Result<CommandResult, String>;

    /// Uninstall a specific version (version must be validated before calling)
    fn uninstall(&self, version: &str) -> Result<CommandResult, String>;

    /// Switch to a specific version (version must be validated before calling)
    fn use_version(&self, version: &str) -> Result<CommandResult, String>;
}
