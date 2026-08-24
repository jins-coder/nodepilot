use regex::Regex;
use std::sync::OnceLock;

// Safe version regex: only allows digits and dots  e.g. "22.14.0" or "v22.14.0"
static VERSION_RE: OnceLock<Regex> = OnceLock::new();

fn version_regex() -> &'static Regex {
    VERSION_RE.get_or_init(|| {
        Regex::new(r"^v?(\d{1,3})\.(\d{1,3})\.(\d{1,3})$").expect("valid regex")
    })
}

/// Validate and normalize a version string.
/// Returns `Some("22.14.0")` on success, `None` if invalid or dangerous.
/// SECURITY: This is the primary injection-prevention gate. Any version string
/// that doesn't strictly match `\d+.\d+.\d+` is rejected before being used
/// as a command argument.
pub fn validate_version(input: &str) -> Option<String> {
    let trimmed = input.trim();
    // Hard cap on length to prevent any creative exploits
    if trimmed.len() > 20 {
        return None;
    }
    let caps = version_regex().captures(trimmed)?;
    let major: u32 = caps[1].parse().ok()?;
    let minor: u32 = caps[2].parse().ok()?;
    let patch: u32 = caps[3].parse().ok()?;
    // Sanity bounds
    if major > 999 || minor > 999 || patch > 999 {
        return None;
    }
    Some(format!("{}.{}.{}", major, minor, patch))
}

/// Parse a version string into (major, minor, patch) components.
pub fn parse_version_parts(version: &str) -> Option<(u32, u32, u32)> {
    let normalized = validate_version(version)?;
    let parts: Vec<&str> = normalized.split('.').collect();
    if parts.len() != 3 {
        return None;
    }
    let major: u32 = parts[0].parse().ok()?;
    let minor: u32 = parts[1].parse().ok()?;
    let patch: u32 = parts[2].parse().ok()?;
    Some((major, minor, patch))
}

#[allow(dead_code)]
pub fn validate_path_safe(path: &str) -> bool {
    // Reject any path containing shell injection chars
    let dangerous_chars = ['&', '|', ';', '`', '$', '(', ')', '<', '>', '\n', '\r'];
    !path.chars().any(|c| dangerous_chars.contains(&c))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_versions() {
        assert_eq!(validate_version("22.14.0"), Some("22.14.0".to_string()));
        assert_eq!(validate_version("v22.14.0"), Some("22.14.0".to_string()));
        assert_eq!(validate_version("20.10.0"), Some("20.10.0".to_string()));
        assert_eq!(validate_version("  18.0.0  "), Some("18.0.0".to_string()));
        assert_eq!(validate_version("0.10.0"), Some("0.10.0".to_string()));
    }

    #[test]
    fn test_injection_blocked() {
        // Classic injection patterns must ALL return None
        assert_eq!(validate_version("20.10.0 && whoami"), None);
        assert_eq!(validate_version("20.10.0; rm -rf /"), None);
        assert_eq!(validate_version("20.10.0 | cat /etc/passwd"), None);
        assert_eq!(validate_version("20.10.0`whoami`"), None);
        assert_eq!(validate_version("$(whoami)"), None);
        assert_eq!(validate_version("../../etc/passwd"), None);
        assert_eq!(validate_version("latest"), None);
        assert_eq!(validate_version("lts/iron"), None);
        assert_eq!(validate_version(""), None);
        assert_eq!(validate_version("..."), None);
    }

    #[test]
    fn test_unreasonable_versions_blocked() {
        assert_eq!(validate_version("9999.9999.9999"), None);
        assert_eq!(validate_version("1000.0.0"), None);
    }

    #[test]
    fn test_parse_parts() {
        assert_eq!(parse_version_parts("22.14.0"), Some((22, 14, 0)));
        assert_eq!(parse_version_parts("v22.14.0"), Some((22, 14, 0)));
        assert_eq!(parse_version_parts("bad"), None);
    }

    #[test]
    fn test_path_safety() {
        assert!(validate_path_safe("C:\\Users\\test\\AppData\\Local\\nvm"));
        assert!(!validate_path_safe("C:\\nvm && del *"));
        assert!(!validate_path_safe("C:\\nvm; whoami"));
        assert!(!validate_path_safe("C:\\nvm`cmd`"));
    }
}
