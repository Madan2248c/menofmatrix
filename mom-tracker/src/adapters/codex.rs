use std::collections::HashMap;
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use serde_json::Value;
use crate::types::{AgentId, AgentUsageSnapshot, TokenUsage};
use super::{empty_token_usage, file_mtime_to_date_string, get_possible_platform_paths, parse_iso_date_string, AgentAdapter};

pub struct CodexAdapter;

impl CodexAdapter {
    fn get_codex_dirs(&self) -> Vec<PathBuf> {
        get_possible_platform_paths(".codex")
            .into_iter()
            .filter(|p| p.exists())
            .collect()
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
                .or_else(|| obj.get("time"))
                .or_else(|| obj.get("created_at"))
                .and_then(Value::as_str)
                .and_then(parse_iso_date_string)
                .unwrap_or_else(|| default_date.clone());

            let u = obj.get("usage")
                .or_else(|| obj.get("tokens"))
                .or_else(|| obj.get("payload").and_then(|p| p.get("info")).and_then(|i| i.get("total_token_usage")))
                .or_else(|| obj.get("payload").and_then(|p| p.get("info")).and_then(|i| i.get("last_token_usage")));

            if let Some(u) = u {
                let input = u.get("input_tokens").or_else(|| u.get("prompt_tokens")).and_then(Value::as_u64).unwrap_or(0);
                let output = u.get("output_tokens").or_else(|| u.get("completion_tokens")).and_then(Value::as_u64).unwrap_or(0);
                let thinking = u.get("thinking_tokens").or_else(|| u.get("reasoning_tokens")).and_then(Value::as_u64).unwrap_or(0);
                let cached = u.get("cached_tokens").or_else(|| u.get("cached_input_tokens")).and_then(Value::as_u64).unwrap_or(0);

                let usage = daily_map.entry(date_str).or_insert_with(empty_token_usage);
                usage.input_tokens += input;
                usage.output_tokens += output;
                usage.thinking_tokens += thinking;
                usage.cached_tokens += cached;
                usage.total_tokens += input + output + thinking;
            }
        }
    }
}

impl AgentAdapter for CodexAdapter {
    fn id(&self) -> AgentId {
        AgentId::Codex
    }

    fn name(&self) -> &'static str {
        "Codex"
    }

    fn detect(&self) -> bool {
        !self.get_codex_dirs().is_empty()
    }

    fn collect_usage(&self) -> Vec<AgentUsageSnapshot> {
        let mut daily_map: HashMap<String, TokenUsage> = HashMap::new();
        let dirs = self.get_codex_dirs();

        for dir in dirs {
            let main_files = ["history.jsonl", "session_index.jsonl"];
            for file in &main_files {
                let path = dir.join(file);
                if path.exists() {
                    self.parse_jsonl_for_tokens(&path, &mut daily_map);
                }
            }

            let sub_dirs = ["sessions", "archived_sessions"];
            for sub in &sub_dirs {
                let sub_path = dir.join(sub);
                if sub_path.exists() {
                    if let Ok(files) = fs::read_dir(sub_path) {
                        for file in files.flatten() {
                            let path = file.path();
                            if path.extension().and_then(|e| e.to_str()) == Some("jsonl") {
                                self.parse_jsonl_for_tokens(&path, &mut daily_map);
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
