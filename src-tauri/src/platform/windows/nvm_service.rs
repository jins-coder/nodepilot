/// NVM Windows Service — implements Node.js version management via nvm-windows
///
/// SECURITY: All version inputs are validated by version_validator before being
/// passed to nvm.exe. Arguments are passed as Vec<&str> to Command::new, never
/// as a shell string.

use std::path::PathBuf;
use regex::Regex;
use std::sync::OnceLock;

use crate::models::{CommandResult, NodeVersion, NvmStatus, LtsStatus};
use crate::utils::process_runner::{run_command, run_command_streaming};
use crate::utils::version_validator::validate_version;
use super::nvm_detector::detect_nvm;

static NVM_LIST_RE: OnceLock<Regex> = OnceLock::new();

fn nvm_list_regex() -> &'static Regex {
    NVM_LIST_RE.get_or_init(|| {
        // Matches lines like: "  * 22.14.0 (Currently using 64-bit executable)" or "    20.10.0"
        Regex::new(r"^\s*(\*?)\s*v?(\d+\.\d+\.\d+)").expect("valid regex")
    })
}

pub struct NvmWindowsService {
    nvm_exe: String,
    nvm_home: String,
    nvm_symlink: String,
}

impl NvmWindowsService {
    /// Create a new service from a detected NvmStatus.
    /// Returns None if nvm is not installed.
    pub fn from_status(status: &NvmStatus) -> Option<Self> {
        if !status.installed {
            return None;
        }
        Some(NvmWindowsService {
            nvm_exe: status.executable_path.clone()?,
            nvm_home: status.nvm_home.clone().unwrap_or_default(),
            nvm_symlink: status.nvm_symlink.clone().unwrap_or_default(),
        })
    }

    /// Get a safe temp directory that has ample disk space
    fn get_safe_temp_dir() -> String {
        let custom_path = PathBuf::from("e:\\Envision\\.tmp");
        if std::fs::create_dir_all(&custom_path).is_ok() {
            return custom_path.to_string_lossy().to_string();
        }

        if let Ok(mut cwd) = std::env::current_dir() {
            cwd.push(".tmp");
            if std::fs::create_dir_all(&cwd).is_ok() {
                return cwd.to_string_lossy().to_string();
            }
        }

        std::env::var("TEMP").unwrap_or_else(|_| "C:\\Temp".to_string())
    }

    /// Run nvm with given args and proper environment
    fn run_nvm(&self, args: &[&str]) -> Result<CommandResult, String> {
        let temp_dir = Self::get_safe_temp_dir();
        let env_pairs = [
            ("NVM_HOME", self.nvm_home.as_str()),
            ("NVM_SYMLINK", self.nvm_symlink.as_str()),
            ("TEMP", temp_dir.as_str()),
            ("TMP", temp_dir.as_str()),
        ];
        run_command(&self.nvm_exe, args, &env_pairs)
    }

    fn run_nvm_streaming<F>(&self, args: &[&str], on_line: F) -> Result<CommandResult, String>
    where
        F: FnMut(&str),
    {
        let temp_dir = Self::get_safe_temp_dir();
        let env_pairs = [
            ("NVM_HOME", self.nvm_home.as_str()),
            ("NVM_SYMLINK", self.nvm_symlink.as_str()),
            ("TEMP", temp_dir.as_str()),
            ("TMP", temp_dir.as_str()),
        ];
        run_command_streaming(&self.nvm_exe, args, &env_pairs, on_line)
    }

    /// List installed Node.js versions
    pub fn list_installed(&self) -> Result<Vec<NodeVersion>, String> {
        let result = self.run_nvm(&["list"])?;

        if !result.success && !result.stdout.contains('.') {
            // nvm list returns exit 0 even with no versions, but may fail otherwise
            if result.stderr.contains("settings.txt") {
                return Err("NVM settings.txt not found. Try reinstalling nvm-windows.".to_string());
            }
        }

        let current_version = self.get_current_version_string();
        let versions = self.parse_nvm_list(&result.stdout, &current_version);
        Ok(versions)
    }

    /// Parse the output of `nvm list`
    fn parse_nvm_list(&self, output: &str, current: &Option<String>) -> Vec<NodeVersion> {
        let re = nvm_list_regex();
        let mut versions = Vec::new();

        for line in output.lines() {
            if let Some(caps) = re.captures(line) {
                let has_star = line.contains('*') || line.contains("Currently using");
                let version_str = caps[2].to_string();

                if let Some((major, minor, patch)) = crate::utils::version_validator::parse_version_parts(&version_str) {
                    let active = if let Some(cur) = current.as_deref() {
                        cur == version_str || cur == format!("v{}", version_str)
                    } else {
                        has_star
                    };

                    versions.push(NodeVersion {
                        version: format!("v{}", version_str),
                        major,
                        minor,
                        patch,
                        lts: LtsStatus::default(), // enriched later from API cache
                        current: false,            // enriched later
                        installed: true,
                        active,
                        date: None,
                        npm: self.get_npm_version_for(&version_str),
                        openssl: None,
                        v8: None,
                        modules: None,
                        arch: Some(self.get_node_arch(&version_str)),
                        install_date: None,
                    });
                }
            }
        }

        // Sort by version descending (newest first)
        versions.sort_by(|a, b| {
            b.major.cmp(&a.major)
                .then(b.minor.cmp(&a.minor))
                .then(b.patch.cmp(&a.patch))
        });

        versions
    }

    /// Get the currently active version string (without 'v' prefix)
    fn get_current_version_string(&self) -> Option<String> {
        // Strategy 1: Test the symlink node.exe directly (ground truth on Windows)
        let symlink_node = PathBuf::from(&self.nvm_symlink).join("node.exe");
        if symlink_node.exists() {
            if let Ok(result) = run_command(&symlink_node.to_string_lossy(), &["-v"], &[]) {
                if result.success {
                    let v = result.stdout.trim().trim_start_matches('v').to_string();
                    if !v.is_empty() {
                        return Some(v);
                    }
                }
            }
        }

        // Strategy 2: Check symlink target path
        if let Ok(target) = std::fs::read_link(&self.nvm_symlink) {
            let target_str = target.to_string_lossy().to_string();
            if let Some(pos) = target_str.rfind('v') {
                let v = &target_str[pos + 1..];
                if crate::utils::version_validator::validate_version(v).is_some() {
                    return Some(v.to_string());
                }
            }
        }

        // Strategy 3: Check `nvm current`
        if let Ok(result) = self.run_nvm(&["current"]) {
            if result.success {
                let v = result.stdout.trim().trim_start_matches('v').to_string();
                if !v.is_empty() && v != "No current version." && v != "none" {
                    return Some(v);
                }
            }
        }

        None
    }

    /// Get the current active Node.js version info
    pub fn get_current_version(&self) -> Result<Option<NodeVersion>, String> {
        let current_str = self.get_current_version_string();

        match current_str {
            None => Ok(None),
            Some(ver_str) => {
                // Get npm version from the active node installation
                let npm_ver = self.get_npm_version_for(&ver_str);
                let arch = self.get_node_arch(&ver_str);

                let parts = crate::utils::version_validator::parse_version_parts(&ver_str)
                    .ok_or_else(|| format!("Invalid version string: {}", ver_str))?;

                Ok(Some(NodeVersion {
                    version: format!("v{}", ver_str),
                    major: parts.0,
                    minor: parts.1,
                    patch: parts.2,
                    lts: LtsStatus::default(),
                    current: false,
                    installed: true,
                    active: true,
                    date: None,
                    npm: npm_ver,
                    openssl: None,
                    v8: None,
                    modules: None,
                    arch: Some(arch),
                    install_date: None,
                }))
            }
        }
    }

    /// Detect architecture of a specific Node.js installation
    fn get_node_arch(&self, version: &str) -> String {
        // Check the installed version folder
        let version_path = PathBuf::from(&self.nvm_home).join(format!("v{}", version));
        let node_exe = version_path.join("node.exe");

        if node_exe.exists() {
            // Check PE header for architecture
            if let Ok(bytes) = std::fs::read(&node_exe) {
                if bytes.len() > 0x40 {
                    // PE signature at offset 0x3C points to PE header
                    if bytes.len() > 4 && &bytes[0..2] == b"MZ" {
                        let pe_offset = u32::from_le_bytes([bytes[0x3C], bytes[0x3D], bytes[0x3E], bytes[0x3F]]) as usize;
                        if bytes.len() > pe_offset + 6 {
                            let machine = u16::from_le_bytes([bytes[pe_offset + 4], bytes[pe_offset + 5]]);
                            return match machine {
                                0x8664 => "x64".to_string(),
                                0xAA64 => "arm64".to_string(),
                                0x014C => "x86".to_string(),
                                _ => "x64".to_string(),
                            };
                        }
                    }
                }
            }
        }
        "x64".to_string()
    }

    /// Get npm version for a specific Node.js installation
    fn get_npm_version_for(&self, version: &str) -> Option<String> {
        let version_path = PathBuf::from(&self.nvm_home).join(format!("v{}", version));
        let npm_cmd = version_path.join("npm.cmd");
        let node_exe = version_path.join("node.exe");

        if npm_cmd.exists() && node_exe.exists() {
            // Use node to run npm --version to avoid PATH issues
            let npm_path = version_path.join("node_modules").join("npm").join("bin").join("npm-cli.js");
            if npm_path.exists() {
                let result = run_command(
                    node_exe.to_str()?,
                    &[npm_path.to_str()?, "--version"],
                    &[],
                ).ok()?;
                if result.success {
                    return Some(result.stdout.trim().to_string());
                }
            }
        }
        None
    }

    /// Install a Node.js version
    /// SECURITY: version is validated before use
    pub fn install_node<F>(&self, version: &str, on_line: F) -> Result<CommandResult, String>
    where
        F: FnMut(&str),
    {
        let safe_version = validate_version(version)
            .ok_or_else(|| format!("Invalid version string: '{}'. Only semver format (x.y.z) is accepted.", version))?;

        self.run_nvm_streaming(&["install", &safe_version], on_line)
    }

    /// Uninstall a Node.js version
    /// SECURITY: version is validated before use
    pub fn uninstall_node(&self, version: &str) -> Result<CommandResult, String> {
        let safe_version = validate_version(version)
            .ok_or_else(|| format!("Invalid version string: '{}'", version))?;

        self.run_nvm(&["uninstall", &safe_version])
    }

    /// Switch to a Node.js version
    /// SECURITY: version is validated before use
    /// NOTE: Requires administrator privileges on Windows (symlink creation)
    pub fn use_node(&self, version: &str) -> Result<CommandResult, String> {
        let safe_version = validate_version(version)
            .ok_or_else(|| format!("Invalid version string: '{}'", version))?;

        let result = self.run_nvm(&["use", &safe_version])?;

        if !result.success {
            // Check for permission errors
            if result.stderr.contains("Access is denied")
                || result.stdout.contains("Access is denied")
                || result.stderr.contains("privilege")
                || result.stdout.contains("requires administrator")
                || result.stderr.contains("requires administrator")
            {
                return Err(
                    "Administrator permissions are required to switch Node.js versions.\n\
                     Please restart NodePilot as Administrator (right-click → Run as administrator)."
                    .to_string()
                );
            }
        }

        Ok(result)
    }

    #[allow(dead_code)]
    pub fn get_nvm_version(&self) -> Result<String, String> {
        let result = self.run_nvm(&["version"])?;
        Ok(result.stdout.trim().to_string())
    }
}

/// Factory function: detect and create service
pub fn create_nvm_service() -> (NvmStatus, Option<NvmWindowsService>) {
    let status = detect_nvm();
    let service = NvmWindowsService::from_status(&status);
    (status, service)
}
