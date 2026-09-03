use std::fs;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use rusqlite::Connection;
use serde_json::Value;
use crate::types::{AgentId, AgentUsageSnapshot, TokenUsage};
use super::{empty_token_usage, get_possible_platform_paths, get_today_date_string, AgentAdapter};

pub struct AntigravityAdapter;

impl AntigravityAdapter {
    fn get_antigravity_dirs(&self) -> Vec<PathBuf> {
        let mut candidates = Vec::new();
        let subpath = Path::new(".gemini").join("antigravity-cli");
        if let Some(sub_str) = subpath.to_str() {
            candidates.extend(get_possible_platform_paths(sub_str));
        }
        candidates.extend(get_possible_platform_paths("antigravity-cli"));
        candidates.into_iter().filter(|p| p.exists()).collect()
    }

    fn parse_sqlite_gen_metadata(&self, db_path: &PathBuf, usage: &mut TokenUsage) {
        let Ok(conn) = Connection::open_with_flags(db_path, rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY) else {
            return;
        };

        let Ok(mut stmt) = conn.prepare("SELECT data FROM gen_metadata ORDER BY idx") else {
            return;
        };

        let rows = stmt.query_map([], |row| {
            let blob: Vec<u8> = row.get(0)?;
            Ok(blob)
        });

        if let Ok(blobs) = rows {
            for blob_res in blobs.flatten() {
                self.extract_tokens_from_proto(&blob_res, usage);
            }
        }
    }

    fn extract_tokens_from_proto(&self, blob: &[u8], usage: &mut TokenUsage) {
        // proto field #1 is chat_model (length-delimited)
        let Some((_, chat_model, _)) = get_proto_sub_message(blob, 1) else { return; };
        // field #4 in chat_model is usage (length-delimited)
        let Some((_, usage_blob, _)) = get_proto_sub_message(chat_model, 4) else { return; };

        let sys_prompt = get_proto_varint(usage_blob, 1).unwrap_or(0);
        let input = get_proto_varint(usage_blob, 2).unwrap_or(0);
        let cache_read = get_proto_varint(usage_blob, 5).unwrap_or(0);
        let output = get_proto_varint(usage_blob, 9).unwrap_or(0);
        let reasoning = get_proto_varint(usage_blob, 10).unwrap_or(0);

        usage.input_tokens += sys_prompt + input;
        usage.output_tokens += output;
        usage.thinking_tokens += reasoning;
        usage.cached_tokens += cache_read;
        usage.total_tokens += sys_prompt + input + output + reasoning;
    }

    fn parse_transcript_for_tokens(&self, path: &PathBuf, usage: &mut TokenUsage) {
        let Ok(file) = fs::File::open(path) else { return; };
        let reader = BufReader::new(file);

        for line in reader.lines().flatten() {
            if line.trim().is_empty() { continue; }
            let Ok(obj) = serde_json::from_str::<Value>(&line) else { continue; };

            let u = obj.get("token_usage").or_else(|| obj.get("usage"));
            if let Some(u) = u {
                let input = u.get("input_tokens").or_else(|| u.get("prompt_tokens")).and_then(Value::as_u64).unwrap_or(0);
                let output = u.get("output_tokens").or_else(|| u.get("completion_tokens")).and_then(Value::as_u64).unwrap_or(0);
                let thinking = u.get("thinking_tokens").and_then(Value::as_u64).unwrap_or(0);
                let cached = u.get("cached_tokens").and_then(Value::as_u64).unwrap_or(0);

                usage.input_tokens += input;
                usage.output_tokens += output;
                usage.thinking_tokens += thinking;
                usage.cached_tokens += cached;
                usage.total_tokens += input + output + thinking;
            }
        }
    }
}

fn read_varint(data: &[u8], pos: &mut usize) -> Option<u64> {
    let mut result: u64 = 0;
    let mut shift = 0;
    while *pos < data.len() {
        let byte = data[*pos];
        *pos += 1;
        result |= ((byte & 0x7f) as u64) << shift;
        if (byte & 0x80) == 0 {
            return Some(result);
        }
        shift += 7;
        if shift >= 64 { break; }
    }
    None
}

fn get_proto_sub_message<'a>(data: &'a [u8], target_field: u32) -> Option<(u32, &'a [u8], u64)> {
    let mut pos = 0;
    while pos < data.len() {
        let tag = read_varint(data, &mut pos)?;
        let field_number = (tag >> 3) as u32;
        let wire_type = (tag & 0x07) as u32;

        match wire_type {
            0 => {
                let val = read_varint(data, &mut pos)?;
                if field_number == target_field {
                    return Some((0, &[], val));
                }
            }
            2 => {
                let len = read_varint(data, &mut pos)? as usize;
                if pos + len > data.len() { break; }
                let sub = &data[pos..pos + len];
                pos += len;
                if field_number == target_field {
                    return Some((2, sub, 0));
                }
            }
            1 => { pos += 8; }
            5 => { pos += 4; }
            _ => break,
        }
    }
    None
}

fn get_proto_varint(data: &[u8], target_field: u32) -> Option<u64> {
    let mut pos = 0;
    while pos < data.len() {
        let tag = read_varint(data, &mut pos)?;
        let field_number = (tag >> 3) as u32;
        let wire_type = (tag & 0x07) as u32;

        match wire_type {
            0 => {
                let val = read_varint(data, &mut pos)?;
                if field_number == target_field {
                    return Some(val);
                }
            }
            2 => {
                let len = read_varint(data, &mut pos)? as usize;
                if pos + len > data.len() { break; }
                pos += len;
            }
            1 => { pos += 8; }
            5 => { pos += 4; }
            _ => break,
        }
    }
    None
}

impl AgentAdapter for AntigravityAdapter {
    fn id(&self) -> AgentId {
        AgentId::Antigravity
    }

    fn name(&self) -> &'static str {
        "Antigravity"
    }

    fn detect(&self) -> bool {
        !self.get_antigravity_dirs().is_empty()
    }

    fn collect_usage(&self) -> AgentUsageSnapshot {
        let mut usage = empty_token_usage();
        let dirs = self.get_antigravity_dirs();

        for dir in dirs {
            // 1. Scan SQLite database files in conversations/
            let conv_dir = dir.join("conversations");
            if conv_dir.exists() {
                if let Ok(files) = fs::read_dir(conv_dir) {
                    for file in files.flatten() {
                        let path = file.path();
                        if path.extension().and_then(|e| e.to_str()) == Some("db") {
                            self.parse_sqlite_gen_metadata(&path, &mut usage);
                        }
                    }
                }
            }

            // 2. Scan brain/ transcript JSONL files
            let brain_dir = dir.join("brain");
            if brain_dir.exists() {
                if let Ok(folders) = fs::read_dir(brain_dir) {
                    for folder in folders.flatten() {
                        let transcript = folder
                            .path()
                            .join(".system_generated")
                            .join("logs")
                            .join("transcript.jsonl");
                        if transcript.exists() {
                            self.parse_transcript_for_tokens(&transcript, &mut usage);
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
