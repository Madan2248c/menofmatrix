use std::collections::HashMap;
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use serde_json::Value;
use crate::types::{AgentId, AgentUsageSnapshot, TokenUsage};
use super::{empty_token_usage, file_mtime_to_date_string, get_possible_platform_paths, parse_iso_date_string, AgentAdapter};

pub struct ClaudeCodeAdapter;

impl ClaudeCodeAdapter {
    fn get_claude_dirs(&self) -> Vec<PathBuf> {
        let mut dirs = get_possible_platform_paths(".claude");
        if let Ok(custom) = std::env::var("CLAUDE_CONFIG_DIR") {
            if !custom.trim().is_empty() {
                dirs.insert(0, PathBuf::from(custom.trim()));
            }
        }
        dirs.into_iter().filter(|p| p.exists()).collect()
    }

    fn parse_jsonl_for_tokens(&self, path: &PathBuf, daily_map: &mut HashMap<String, TokenUsage>) {
        let Ok(file) = fs::File::open(path) else { return; };
        let default_date = file_mtime_to_date_string(path);
        let reader = BufReader::new(file);

        for line in reader.lines().flatten() {
            if line.trim().is_empty() { continue; }
            let Ok(obj) = serde_json::from_str::<Value>(&line) else { continue; };

            let date_str = obj
                .get("timestamp")
                .or_else(|| obj.get("created_at"))
                .and_then(Value::as_str)
                .and_then(parse_iso_date_string)
                .unwrap_or_else(|| default_date.clone());

            let u = if obj.get("usage").is_some() {
                obj.get("usage")
            } else {
                obj.get("message").and_then(|m| m.get("usage"))
            };

            if let Some(u) = u {
                let input = u.get("input_tokens").and_then(Value::as_u64).unwrap_or(0);
                let output = u.get("output_tokens").and_then(Value::as_u64).unwrap_or(0);
                let thinking = u.get("thinking_tokens").or_else(|| u.get("thinking")).and_then(Value::as_u64).unwrap_or(0);
                let cached_read = u.get("cache_read_input_tokens").or_else(|| u.get("cached_tokens")).and_then(Value::as_u64).unwrap_or(0);
                let cached_write = u.get("cache_creation_input_tokens").and_then(Value::as_u64).unwrap_or(0);

                let usage = daily_map.entry(date_str).or_insert_with(empty_token_usage);
                usage.input_tokens += input;
                usage.output_tokens += output;
                usage.thinking_tokens += thinking;
                usage.cached_tokens += cached_read + cached_write;
                usage.total_tokens += input + output + thinking;
            }
        }
    }
}

impl AgentAdapter for ClaudeCodeAdapter {
    fn id(&self) -> AgentId {
        AgentId::ClaudeCode
    }

    fn name(&self) -> &'static str {
        "Claude Code"
    }

    fn detect(&self) -> bool {
        !self.get_claude_dirs().is_empty()
    }

    fn collect_usage(&self) -> Vec<AgentUsageSnapshot> {
        let mut daily_map: HashMap<String, TokenUsage> = HashMap::new();
        let dirs = self.get_claude_dirs();

        for dir in dirs {
            // 1. stats-cache.json (dailyActivity array has date-wise breakdown)
            let stats_file = dir.join("stats-cache.json");
            if stats_file.exists() {
                if let Ok(raw) = fs::read_to_string(&stats_file) {
                    if let Ok(parsed) = serde_json::from_str::<Value>(&raw) {
                        if let Some(daily) = parsed.get("dailyActivity").and_then(Value::as_array) {
                            for item in daily {
                                if let Some(date_str) = item.get("date").and_then(Value::as_str) {
                                    let usage = daily_map.entry(date_str.to_string()).or_insert_with(empty_token_usage);

                                    if let Some(t) = item.get("totalTokens").and_then(Value::as_u64) {
                                        usage.total_tokens += t;
                                    }
                                    if let Some(i) = item.get("inputTokens").and_then(Value::as_u64) {
                                        usage.input_tokens += i;
                                    }
                                    if let Some(o) = item.get("outputTokens").and_then(Value::as_u64) {
                                        usage.output_tokens += o;
                                    }
                                    if let Some(th) = item.get("thinkingTokens").and_then(Value::as_u64) {
                                        usage.thinking_tokens += th;
                                    }
                                    if let Some(c) = item.get("cachedTokens").and_then(Value::as_u64) {
                                        usage.cached_tokens += c;
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                // 2. projects/ JSONL files fallback
                let projects_dir = dir.join("projects");
                if projects_dir.exists() {
                    if let Ok(entries) = fs::read_dir(projects_dir) {
                        for entry in entries.flatten() {
                            let path = entry.path();
                            if path.is_dir() {
                                if let Ok(files) = fs::read_dir(path) {
                                    for file in files.flatten() {
                                        let fp = file.path();
                                        if fp.extension().and_then(|e| e.to_str()) == Some("jsonl") {
                                            self.parse_jsonl_for_tokens(&fp, &mut daily_map);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // 3. sessions/ JSONL files fallback
                let sessions_dir = dir.join("sessions");
                if sessions_dir.exists() {
                    if let Ok(files) = fs::read_dir(sessions_dir) {
                        for file in files.flatten() {
                            let fp = file.path();
                            if fp.extension().and_then(|e| e.to_str()) == Some("jsonl") {
                                self.parse_jsonl_for_tokens(&fp, &mut daily_map);
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
