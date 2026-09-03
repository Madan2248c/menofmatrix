pub mod opencode;
pub mod claudecode;
pub mod codex;
pub mod antigravity;
pub mod cline;

use std::path::PathBuf;
use crate::types::{AgentDetectResult, AgentId, AgentUsageSnapshot, TokenUsage};

pub trait AgentAdapter {
    fn id(&self) -> AgentId;
    fn name(&self) -> &'static str;
    fn detect(&self) -> bool;
    fn collect_usage(&self) -> AgentUsageSnapshot;
}

pub fn get_possible_platform_paths(relative_subpath: &str) -> Vec<PathBuf> {
    let mut candidates = Vec::new();
    if let Some(home) = dirs::home_dir() {
        candidates.push(home.join(relative_subpath));

        #[cfg(target_os = "windows")]
        {
            if let Ok(appdata) = std::env::var("APPDATA") {
                candidates.push(PathBuf::from(appdata).join(relative_subpath));
            }
            if let Ok(localappdata) = std::env::var("LOCALAPPDATA") {
                candidates.push(PathBuf::from(localappdata).join(relative_subpath));
            }
            candidates.push(home.join("AppData").join("Roaming").join(relative_subpath));
            candidates.push(home.join("AppData").join("Local").join(relative_subpath));
        }

        #[cfg(target_os = "macos")]
        {
            candidates.push(home.join("Library").join("Application Support").join(relative_subpath));
            candidates.push(home.join(".config").join(relative_subpath));
            candidates.push(home.join(".local").join("share").join(relative_subpath));
        }

        #[cfg(not(any(target_os = "windows", target_os = "macos")))]
        {
            if let Ok(xdg_config) = std::env::var("XDG_CONFIG_HOME") {
                candidates.push(PathBuf::from(xdg_config).join(relative_subpath));
            }
            if let Ok(xdg_data) = std::env::var("XDG_DATA_HOME") {
                candidates.push(PathBuf::from(xdg_data).join(relative_subpath));
            }
            candidates.push(home.join(".config").join(relative_subpath));
            candidates.push(home.join(".local").join("share").join(relative_subpath));
        }
    }

    candidates
}

pub fn get_all_adapters() -> Vec<Box<dyn AgentAdapter>> {
    vec![
        Box::new(opencode::OpenCodeAdapter),
        Box::new(claudecode::ClaudeCodeAdapter),
        Box::new(codex::CodexAdapter),
        Box::new(antigravity::AntigravityAdapter),
        Box::new(cline::ClineAdapter),
    ]
}

pub fn detect_installed_agents() -> Vec<AgentDetectResult> {
    let adapters = get_all_adapters();
    adapters
        .into_iter()
        .map(|a| AgentDetectResult {
            id: a.id(),
            name: a.name().to_string(),
            installed: a.detect(),
        })
        .collect()
}

pub fn collect_all_agent_usage() -> Vec<AgentUsageSnapshot> {
    let adapters = get_all_adapters();
    let mut snapshots = Vec::new();
    for a in adapters {
        if a.detect() {
            snapshots.push(a.collect_usage());
        }
    }
    snapshots
}

pub fn empty_token_usage() -> TokenUsage {
    TokenUsage::default()
}

pub fn get_today_date_string() -> String {
    chrono::Utc::now().format("%Y-%m-%d").to_string()
}
