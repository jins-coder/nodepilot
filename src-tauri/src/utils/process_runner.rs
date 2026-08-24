use std::process::Command;
use std::time::Instant;
use std::sync::atomic::{AtomicU32, Ordering};
use crate::models::CommandResult;

pub static ACTIVE_CHILD_PID: AtomicU32 = AtomicU32::new(0);

/// Kill any currently active streaming process
pub fn kill_active_process() {
    let pid = ACTIVE_CHILD_PID.swap(0, Ordering::SeqCst);
    if pid > 0 {
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            let _ = Command::new("taskkill")
                .args(&["/F", "/T", "/PID", &pid.to_string()])
                .creation_flags(0x08000000)
                .output();
        }
    }
    // Also cleanup any orphan nvm install processes
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        let _ = Command::new("taskkill")
            .args(&["/F", "/IM", "nvm.exe"])
            .creation_flags(0x08000000)
            .output();
    }
}

/// Execute an external command safely using an argument array.
pub fn run_command(
    executable: &str,
    args: &[&str],
    env_vars: &[(&str, &str)],
) -> Result<CommandResult, String> {
    let start = Instant::now();

    let mut cmd = Command::new(executable);
    cmd.args(args);

    for (key, value) in env_vars {
        cmd.env(key, value);
    }

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }

    let output = cmd.output().map_err(|e| format!("Failed to execute '{}': {}", executable, e))?;

    let duration_ms = start.elapsed().as_millis() as u64;
    let exit_code = output.status.code().unwrap_or(-1);
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    Ok(CommandResult {
        success: output.status.success(),
        stdout,
        stderr,
        exit_code,
        duration_ms,
    })
}

/// Spawn a command and stream its output line by line via a callback.
pub fn run_command_streaming<F>(
    executable: &str,
    args: &[&str],
    env_vars: &[(&str, &str)],
    mut on_line: F,
) -> Result<CommandResult, String>
where
    F: FnMut(&str),
{
    use std::io::Read;
    use std::sync::mpsc;
    use std::thread;

    let start = Instant::now();

    let mut cmd = Command::new(executable);
    cmd.args(args);
    cmd.stdout(std::process::Stdio::piped());
    cmd.stderr(std::process::Stdio::piped());

    for (key, value) in env_vars {
        cmd.env(key, value);
    }

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }

    let mut child = cmd.spawn().map_err(|e| format!("Failed to spawn '{}': {}", executable, e))?;
    ACTIVE_CHILD_PID.store(child.id(), Ordering::SeqCst);

    let (tx, rx) = mpsc::channel::<String>();

    // Stdout reader thread
    let stdout_handle = if let Some(mut stdout) = child.stdout.take() {
        let tx_out = tx.clone();
        Some(thread::spawn(move || {
            let mut buf = [0u8; 1024];
            let mut line_buf = Vec::new();

            while let Ok(n) = stdout.read(&mut buf) {
                if n == 0 {
                    break;
                }
                for &byte in &buf[..n] {
                    if byte == b'\n' || byte == b'\r' {
                        if !line_buf.is_empty() {
                            let s = String::from_utf8_lossy(&line_buf).trim().to_string();
                            if !s.is_empty() {
                                let _ = tx_out.send(s);
                            }
                            line_buf.clear();
                        }
                    } else {
                        line_buf.push(byte);
                    }
                }
            }
            if !line_buf.is_empty() {
                let s = String::from_utf8_lossy(&line_buf).trim().to_string();
                if !s.is_empty() {
                    let _ = tx_out.send(s);
                }
            }
        }))
    } else {
        None
    };

    // Stderr reader thread
    let stderr_handle = if let Some(mut stderr) = child.stderr.take() {
        let tx_err = tx.clone();
        Some(thread::spawn(move || {
            let mut err_buf = Vec::new();
            stderr.read_to_end(&mut err_buf).ok();
            let err_str = String::from_utf8_lossy(&err_buf).trim().to_string();
            if !err_str.is_empty() {
                let _ = tx_err.send(format!("[stderr] {}", err_str));
            }
            err_str
        }))
    } else {
        None
    };

    drop(tx);

    let mut all_lines: Vec<String> = Vec::new();

    while let Ok(line) = rx.recv() {
        on_line(&line);
        all_lines.push(line);
    }

    if let Some(h) = stdout_handle {
        h.join().ok();
    }

    let stderr_str = if let Some(h) = stderr_handle {
        h.join().unwrap_or_default()
    } else {
        String::new()
    };

    let status = child.wait().map_err(|e| format!("Failed to wait for process: {}", e))?;
    ACTIVE_CHILD_PID.store(0, Ordering::SeqCst);

    let duration_ms = start.elapsed().as_millis() as u64;
    let exit_code = status.code().unwrap_or(-1);
    let stdout = all_lines.join("\n");

    Ok(CommandResult {
        success: status.success(),
        stdout,
        stderr: stderr_str,
        exit_code,
        duration_ms,
    })
}
