use std::fs;
use std::path::{Path, PathBuf};
use serde_json::Value;
use crate::types::{AgentId, AgentUsageSnapshot, TokenUsage};
use super::{empty_token_usage, get_possible_platform_paths, get_today_date_string, AgentAdapter};

pub struct ClineAdapter;

impl ClineAdapter {
    fn get_cline_paths(&self) -> Vec<PathBuf> {
        let mut candidates = Vec::new();
        let subpath = Path::new("Code").join("User").join("globalStorage").join("saoudrizwan.claude-dev");
        if let Some(sub_str) = subpath.to_str() {
            candidates.extend(get_possible_platform_paths(sub_str));
        }
        candidates.extend(get_possible_platform_paths(".cline"));
        candidates.into_iter().filter(|p| p.exists()).collect()
    }

    fn parse_cline_history(&self, path: &PathBuf, usage: &mut TokenUsage) {
        let Ok(raw) = fs::read_to_string(path) else { return; };
        let Ok(messages) = serde_json::from_str::<Value>(&raw) else { return; };

        let arr = if messages.is_array() {
            messages.as_array()
        } else {
            messages.get("messages").and_then(Value::as_array)
        };

        if let Some(messages_arr) = arr {
            for msg in messages_arr {
                let m = msg.get("metrics").unwrap_or(msg);
                let input = m.get("tokensIn")
                    .or_else(|| m.get("inputTokens"))
                    .or_else(|| m.get("tokens").and_then(|t| t.get("input")))
                    .and_then(Value::as_u64)
                    .unwrap_or(0);

                let output = m.get("tokensOut")
                    .or_else(|| m.get("outputTokens"))
                    .or_else(|| m.get("tokens").and_then(|t| t.get("output")))
                    .and_then(Value::as_u64)
                    .unwrap_or(0);

                let cache_write = m.get("cacheWriteTokens")
                    .or_else(|| m.get("cacheWrites"))
                    .and_then(Value::as_u64)
                    .unwrap_or(0);

                let cache_read = m.get("cacheReadTokens")
                    .or_else(|| m.get("cacheReads"))
                    .and_then(Value::as_u64)
                    .unwrap_or(0);

                usage.input_tokens += input;
                usage.output_tokens += output;
                usage.cached_tokens += cache_read + cache_write;
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
        !self.get_cline_paths().is_empty()
    }

    fn collect_usage(&self) -> AgentUsageSnapshot {
        let mut usage = empty_token_usage();
        let paths = self.get_cline_paths();
        let today_str = get_today_date_string();

        for cline_path in paths {
            let tasks_dir = cline_path.join("tasks");
            if tasks_dir.exists() {
                if let Ok(task_folders) = fs::read_dir(tasks_dir) {
                    for folder in task_folders.flatten() {
                        let tp = folder.path();
                        if tp.is_dir() {
                            let api_req = tp.join("api_conversation_history.json");
                            let ui_msg = tp.join("ui_messages.json");
                            if api_req.exists() {
                                self.parse_cline_history(&api_req, &mut usage);
                            }
                            if ui_msg.exists() {
                                self.parse_cline_history(&ui_msg, &mut usage);
                            }
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
            date: today_str,
            usage,
        }
    }
}
