use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use serde_json::Value;
use crate::types::{AgentId, AgentUsageSnapshot, TokenUsage};
use super::{empty_token_usage, file_mtime_to_date_string, get_possible_platform_paths, parse_iso_date_string, AgentAdapter};

pub struct ClineAdapter;

impl ClineAdapter {
    fn get_cline_dirs(&self) -> Vec<PathBuf> {
        let mut candidates = Vec::new();
        candidates.extend(get_possible_platform_paths("saoudrizwan.claude-dev"));
        candidates.extend(get_possible_platform_paths(".cline"));
        candidates.extend(get_possible_platform_paths("cline"));
        candidates.into_iter().filter(|p| p.exists()).collect()
    }

    fn parse_json_for_tokens(&self, path: &PathBuf, daily_map: &mut HashMap<String, TokenUsage>) {
        let Ok(raw) = fs::read_to_string(path) else { return; };
        let default_date = file_mtime_to_date_string(path);
        let Ok(parsed) = serde_json::from_str::<Value>(&raw) else { return; };

        let items = if parsed.is_array() {
            parsed.as_array().cloned().unwrap_or_default()
        } else {
            vec![parsed]
        };

        for obj in items {
            let date_str = obj
                .get("ts")
                .and_then(Value::as_i64)
                .map(super::timestamp_to_date_string)
                .or_else(|| {
                    obj.get("timestamp")
                        .and_then(Value::as_str)
                        .and_then(parse_iso_date_string)
                })
                .unwrap_or_else(|| default_date.clone());

            let u = obj.get("tokenUsage").or_else(|| obj.get("usage"));
            if let Some(u) = u {
                let input = u.get("tokensIn").or_else(|| u.get("input_tokens")).and_then(Value::as_u64).unwrap_or(0);
                let output = u.get("tokensOut").or_else(|| u.get("output_tokens")).and_then(Value::as_u64).unwrap_or(0);
                let cached_read = u.get("cacheReads").or_else(|| u.get("cached_tokens")).and_then(Value::as_u64).unwrap_or(0);
                let cached_write = u.get("cacheWrites").and_then(Value::as_u64).unwrap_or(0);

                let usage = daily_map.entry(date_str).or_insert_with(empty_token_usage);
                usage.input_tokens += input;
                usage.output_tokens += output;
                usage.cached_tokens += cached_read + cached_write;
                usage.total_tokens += input + output;
            }
        }
    }
}

impl AgentAdapter for ClineAdapter {
    fn id(&self) -> AgentId {
        AgentId::Cline
    }

    fn name(&self) -> &'static str {
        "Cline"
    }

    fn detect(&self) -> bool {
        !self.get_cline_dirs().is_empty()
    }

    fn collect_usage(&self) -> Vec<AgentUsageSnapshot> {
        let mut daily_map: HashMap<String, TokenUsage> = HashMap::new();
        let dirs = self.get_cline_dirs();

        for dir in dirs {
            let tasks_dir = dir.join("tasks");
            if tasks_dir.exists() {
                if let Ok(entries) = fs::read_dir(tasks_dir) {
                    for entry in entries.flatten() {
                        let path = entry.path();
                        if path.is_dir() {
                            let files = ["api_conversation_history.json", "ui_messages.json"];
                            for f in &files {
                                let fp = path.join(f);
                                if fp.exists() {
                                    self.parse_json_for_tokens(&fp, &mut daily_map);
                                }
                            }
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
