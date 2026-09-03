use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use rusqlite::Connection;
use serde_json::Value;
use crate::types::{AgentId, AgentUsageSnapshot, TokenUsage};
use super::{empty_token_usage, get_possible_platform_paths, get_today_date_string, timestamp_to_date_string, AgentAdapter};

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

    fn parse_sqlite_opencode(&self, db_path: &PathBuf, daily_map: &mut HashMap<String, TokenUsage>) {
        let Ok(conn) = Connection::open_with_flags(db_path, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY) else {
            return;
        };

        let tables = ["message", "session_message"];
        for table in &tables {
            let query = format!("SELECT time_created, data FROM {}", table);
            let Ok(mut stmt) = conn.prepare(&query) else { continue; };

            let rows = stmt.query_map([], |row| {
                let tc: i64 = row.get(0)?;
                let data_str: String = row.get(1)?;
                Ok((tc, data_str))
            });

            if let Ok(data_rows) = rows {
                for res in data_rows.flatten() {
                    let (tc, data_str) = res;
                    let date_str = timestamp_to_date_string(tc);

                    if let Ok(parsed) = serde_json::from_str::<Value>(&data_str) {
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

                            let usage = daily_map.entry(date_str).or_insert_with(empty_token_usage);
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

    fn collect_usage(&self) -> Vec<AgentUsageSnapshot> {
        let mut daily_map: HashMap<String, TokenUsage> = HashMap::new();
        let dirs = self.get_opencode_dirs();

        for dir in dirs {
            let db_path = dir.join("opencode.db");
            if db_path.exists() {
                self.parse_sqlite_opencode(&db_path, &mut daily_map);
            }

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

                            let usage = daily_map.entry(get_today_date_string()).or_insert_with(empty_token_usage);
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

        daily_map
            .into_iter()
            .map(|(date_str, usage)| AgentUsageSnapshot {
                agent_id: self.id(),
                agent_name: self.name().to_string(),
                timestamp: chrono::Utc::now().to_rfc3339(),
                date: date_str,
                usage,
            })
            .collect()
    }
}
