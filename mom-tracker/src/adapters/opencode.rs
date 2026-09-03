use std::fs;
use std::path::{Path, PathBuf};
use rusqlite::Connection;
use serde_json::Value;
use crate::types::{AgentId, AgentUsageSnapshot, TokenUsage};
use super::{empty_token_usage, get_possible_platform_paths, get_today_date_string, AgentAdapter};

pub struct OpenCodeAdapter;

impl OpenCodeAdapter {
    fn get_opencode_dirs(&self) -> Vec<PathBuf> {
        let mut candidates = Vec::new();
        let subpath = Path::new(".local").join("share").join("opencode");
        if let Some(sub_str) = subpath.to_str() {
            candidates.extend(get_possible_platform_paths(sub_str));
        }
        candidates.extend(get_possible_platform_paths(".opencode"));
        candidates.extend(get_possible_platform_paths("opencode"));
        candidates.into_iter().filter(|p| p.exists()).collect()
    }

    fn parse_sqlite_opencode(&self, db_path: &PathBuf, usage: &mut TokenUsage) {
        let Ok(conn) = Connection::open_with_flags(db_path, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY) else {
            return;
        };

        let tables = ["message", "session_message"];
        for table in &tables {
            let query = format!("SELECT data FROM {}", table);
            let Ok(mut stmt) = conn.prepare(&query) else { continue; };

            let rows = stmt.query_map([], |row| {
                let data_str: String = row.get(0)?;
                Ok(data_str)
            });

            if let Ok(data_rows) = rows {
                for data_res in data_rows.flatten() {
                    if let Ok(parsed) = serde_json::from_str::<Value>(&data_res) {
                        if let Some(role) = parsed.get("role").and_then(Value::as_str) {
                            if role != "assistant" { continue; }
                        }

                        if let Some(t) = parsed.get("tokens") {
                            let input = t.get("input").and_then(Value::as_u64).unwrap_or(0);
                            let output = t.get("output").and_then(Value::as_u64).unwrap_or(0);
                            let reasoning = t.get("reasoning").or_else(|| t.get("thinking")).and_then(Value::as_u64).unwrap_or(0);
                            let cache_read = t.get("cache").and_then(|c| c.get("read")).and_then(Value::as_u64).unwrap_or(0);
                            let cache_write = t.get("cache").and_then(|c| c.get("write")).and_then(Value::as_u64).unwrap_or(0);
                            let total = t.get("total").and_then(Value::as_u64).unwrap_or(input + output + reasoning);

                            usage.input_tokens += input;
                            usage.output_tokens += output;
                            usage.thinking_tokens += reasoning;
                            usage.cached_tokens += cache_read + cache_write;
                            usage.total_tokens += total;
                        }
                    }
                }
            }
        }
    }
}

impl AgentAdapter for OpenCodeAdapter {
    fn id(&self) -> AgentId {
        AgentId::OpenCode
    }

    fn name(&self) -> &'static str {
        "OpenCode"
    }

    fn detect(&self) -> bool {
        !self.get_opencode_dirs().is_empty()
    }

    fn collect_usage(&self) -> AgentUsageSnapshot {
        let mut usage = empty_token_usage();
        let dirs = self.get_opencode_dirs();

        for dir in dirs {
            // 1. Scan opencode.db SQLite database
            let db_path = dir.join("opencode.db");
            if db_path.exists() {
                self.parse_sqlite_opencode(&db_path, &mut usage);
            }

            // 2. Scan stats.json if present
            let stats_file = dir.join("stats.json");
            if stats_file.exists() {
                if let Ok(raw) = fs::read_to_string(&stats_file) {
                    if let Ok(parsed) = serde_json::from_str::<Value>(&raw) {
                        if let Some(t) = parsed.get("tokens") {
                            let input = t.get("input").and_then(Value::as_u64).unwrap_or(0);
                            let output = t.get("output").and_then(Value::as_u64).unwrap_or(0);
                            let thinking = t.get("thinking").and_then(Value::as_u64).unwrap_or(0);
                            let cached = t.get("cached").and_then(Value::as_u64).unwrap_or(0);
                            let total = t.get("total").and_then(Value::as_u64).unwrap_or(input + output + thinking);

                            usage.input_tokens += input;
                            usage.output_tokens += output;
                            usage.thinking_tokens += thinking;
                            usage.cached_tokens += cached;
                            usage.total_tokens += total;
                        }
                    }
                }
            }
        }

        if usage.total_tokens == 0 {
            usage.total_tokens = usage.input_tokens + usage.output_tokens + usage.thinking_tokens;
        }

        AgentUsageSnapshot {
            agent_id: self.id(),
            agent_name: self.name().to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            date: get_today_date_string(),
            usage,
        }
    }
}
