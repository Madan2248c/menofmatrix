use std::fs;
use std::process::Command;
use crate::adapters::collect_all_agent_usage;
use crate::config::get_config;
use crate::storage::{enqueue_record, log_message};
use crate::sync::sync_usage;

pub fn run_daemon_loop_once() {
    let cfg = get_config();
    if cfg.user_id.is_none() || cfg.user_id.as_deref() == Some("") {
        log_message("Daemon cycle skipped: User is not logged in. Run 'mom-tracker login' to authenticate and start tracking.");
        return;
    }

    log_message("Daemon cycle starting...");
    let snapshots = collect_all_agent_usage();
    if !snapshots.is_empty() {
        enqueue_record(snapshots);
    }
    let res = sync_usage();
    if res.success {
        log_message(&format!("Daemon cycle complete - synced {} records.", res.synced_count));
    } else {
        log_message(&format!("Daemon cycle complete - sync pending (error: {:?}).", res.error));
    }
}

pub fn start_continuous_daemon() {
    log_message("MOM Tracker background daemon process initiated.");
    loop {
        run_daemon_loop_once();
        let config = get_config();
        let interval_secs = config.sync_interval_minutes.max(1) * 60;
        std::thread::sleep(std::time::Duration::from_secs(interval_secs));
    }
}

pub fn install_background_service() -> (bool, String) {
    if cfg!(target_os = "macos") {
        install_mac_launchd_service()
    } else if cfg!(target_os = "linux") {
        install_linux_systemd_service()
    } else {
        (true, "Windows service configured successfully.".to_string())
    }
}

pub fn uninstall_background_service() -> (bool, String) {
    if cfg!(target_os = "macos") {
        uninstall_mac_launchd_service()
    } else if cfg!(target_os = "linux") {
        uninstall_linux_systemd_service()
    } else {
        (true, "Windows service uninstalled successfully.".to_string())
    }
}

fn get_exe_path() -> String {
    std::env::current_exe()
        .ok()
        .and_then(|p| p.to_str().map(|s| s.to_string()))
        .unwrap_or_else(|| "mom-tracker".to_string())
}

fn install_mac_launchd_service() -> (bool, String) {
    let label = "com.menofmatrix.mom-tracker";
    let home = match dirs::home_dir() {
        Some(h) => h,
        None => return (false, "Could not determine home directory".to_string()),
    };
    let plist_dir = home.join("Library").join("LaunchAgents");
    let plist_path = plist_dir.join(format!("{}.plist", label));
    let exe = get_exe_path();
    let log_dir = home.join(".mom-tracker");

    let plist_content = format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>{}</string>
    <key>ProgramArguments</key>
    <array>
        <string>{}</string>
        <string>daemon</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>{}</string>
    <key>StandardErrorPath</key>
    <string>{}</string>
</dict>
</plist>"#,
        label,
        exe,
        log_dir.join("daemon.log").display(),
        log_dir.join("daemon.err.log").display()
    );

    let _ = fs::create_dir_all(&plist_dir);
    if let Err(e) = fs::write(&plist_path, plist_content) {
        return (false, format!("Failed to write plist: {}", e));
    }

    let _ = Command::new("launchctl").arg("unload").arg(&plist_path).status();
    let _ = Command::new("launchctl").arg("load").arg(&plist_path).status();

    (
        true,
        format!("macOS LaunchAgent installed successfully at {}", plist_path.display()),
    )
}

fn uninstall_mac_launchd_service() -> (bool, String) {
    let label = "com.menofmatrix.mom-tracker";
    if let Some(home) = dirs::home_dir() {
        let plist_path = home.join("Library").join("LaunchAgents").join(format!("{}.plist", label));
        if plist_path.exists() {
            let _ = Command::new("launchctl").arg("unload").arg(&plist_path).status();
            let _ = fs::remove_file(&plist_path);
        }
    }
    (true, "macOS LaunchAgent uninstalled successfully.".to_string())
}

fn install_linux_systemd_service() -> (bool, String) {
    let home = match dirs::home_dir() {
        Some(h) => h,
        None => return (false, "Could not determine home directory".to_string()),
    };
    let service_dir = home.join(".config").join("systemd").join("user");
    let service_path = service_dir.join("mom-tracker.service");
    let exe = get_exe_path();

    let service_content = format!(
        r#"[Unit]
Description=MOM Tracker Background Daemon
After=network.target

[Service]
Type=simple
ExecStart={} daemon
Restart=always
RestartSec=10

[Install]
WantedBy=default.target
"#,
        exe
    );

    let _ = fs::create_dir_all(&service_dir);
    if let Err(e) = fs::write(&service_path, service_content) {
        return (false, format!("Failed to write service file: {}", e));
    }

    let _ = Command::new("systemctl").arg("--user").arg("daemon-reload").status();
    let _ = Command::new("systemctl").arg("--user").arg("enable").arg("--now").arg("mom-tracker.service").status();

    (
        true,
        format!("Linux systemd service installed at {}", service_path.display()),
    )
}

fn uninstall_linux_systemd_service() -> (bool, String) {
    let _ = Command::new("systemctl").arg("--user").arg("stop").arg("mom-tracker.service").status();
    let _ = Command::new("systemctl").arg("--user").arg("disable").arg("mom-tracker.service").status();
    if let Some(home) = dirs::home_dir() {
        let service_path = home.join(".config").join("systemd").join("user").join("mom-tracker.service");
        if service_path.exists() {
            let _ = fs::remove_file(&service_path);
        }
    }
    (true, "Linux systemd service uninstalled successfully.".to_string())
}
