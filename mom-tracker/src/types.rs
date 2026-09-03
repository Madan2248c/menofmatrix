use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum AgentId {
    OpenCode,
    ClaudeCode,
    Codex,
    Antigravity,
    Cline,
}

impl AgentId {
    pub fn as_str(&self) -> &'static str {
        match self {
            AgentId::OpenCode => "opencode",
            AgentId::ClaudeCode => "claudecode",
            AgentId::Codex => "codex",
            AgentId::Antigravity => "antigravity",
            AgentId::Cline => "cline",
        }
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            AgentId::OpenCode => "OpenCode",
            AgentId::ClaudeCode => "Claude Code",
            AgentId::Codex => "Codex",
            AgentId::Antigravity => "Antigravity",
            AgentId::Cline => "Cline",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TokenUsage {
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub thinking_tokens: u64,
    pub cached_tokens: u64,
    pub total_tokens: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentUsageSnapshot {
    pub agent_id: AgentId,
    pub agent_name: String,
    pub timestamp: String,
    pub date: String,
    pub usage: TokenUsage,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueuedUsageRecord {
    pub id: String,
    pub timestamp: String,
    pub user_id: String,
    pub snapshots: Vec<AgentUsageSnapshot>,
    pub synced: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackerConfig {
    pub user_id: Option<String>,
    pub user_email: Option<String>,
    pub auth_token: Option<String>,
    pub api_endpoint: String,
    pub discovery_url: String,
    pub is_manual_endpoint_override: bool,
    pub sync_interval_minutes: u64,
    pub max_storage_mb: u64,
    pub timezone: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageStats {
    pub used_bytes: u64,
    pub used_mb: f64,
    pub max_bytes: u64,
    pub max_mb: u64,
    pub percent_used: f64,
    pub record_count: usize,
    pub is_ceiling_reached: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentDetectResult {
    pub id: AgentId,
    pub name: String,
    pub installed: bool,
}
