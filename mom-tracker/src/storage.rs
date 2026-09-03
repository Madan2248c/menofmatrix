use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use chrono::Utc;
use uuid::Uuid;
use crate::config::{get_config, get_storage_dir};
use crate::types::{AgentUsageSnapshot, QueuedUsageRecord, StorageStats};

pub fn get_queue_file_path() -> PathBuf {
    get_storage_dir().join("queue.json")
}

pub fn get_log_file_path() -> PathBuf {
    get_storage_dir().join("tracker.log")
}

pub fn log_message(msg: &str) {
    let log_path = get_log_file_path();
    let timestamp = Utc::now().to_rfc3339();
    let line = format!("[{}] {}\n", timestamp, msg);

    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(&log_path) {
        let _ = file.write_all(line.as_bytes());
    }

    check_and_rotate_logs();
}

pub fn get_storage_stats() -> StorageStats {
    let config = get_config();
    let max_bytes = config.max_storage_mb * 1024 * 1024;
    let mut used_bytes: u64 = 0;
    let records = read_queue();
    let record_count = records.len();

    let queue_path = get_queue_file_path();
    if queue_path.exists() {
        if let Ok(meta) = fs::metadata(&queue_path) {
            used_bytes += meta.len();
        }
    }

    let log_path = get_log_file_path();
    if log_path.exists() {
        if let Ok(meta) = fs::metadata(&log_path) {
            used_bytes += meta.len();
        }
    }

    let used_mb = (used_bytes as f64) / (1024.0 * 1024.0);
    let percent_used = ((used_bytes as f64) / (max_bytes as f64)) * 100.0;

    StorageStats {
        used_bytes,
        used_mb: (used_mb * 100.0).round() / 100.0,
        max_bytes,
        max_mb: config.max_storage_mb,
        percent_used: (percent_used * 100.0).round() / 100.0,
        record_count,
        is_ceiling_reached: used_bytes >= max_bytes,
    }
}

pub fn read_queue() -> Vec<QueuedUsageRecord> {
    let queue_path = get_queue_file_path();
    if !queue_path.exists() {
        return Vec::new();
    }
    match fs::read_to_string(&queue_path) {
        Ok(raw) => serde_json::from_str::<Vec<QueuedUsageRecord>>(&raw).unwrap_or_default(),
        Err(_) => Vec::new(),
    }
}

pub fn write_queue(mut records: Vec<QueuedUsageRecord>) {
    let stats = get_storage_stats();
    if stats.is_ceiling_reached {
        records.retain(|r| !r.synced);
        if records.len() > 100 {
            let start = records.len().saturating_sub(100);
            records = records.split_off(start);
        }
    }

    let queue_path = get_queue_file_path();
    if let Ok(raw) = serde_json::to_string_pretty(&records) {
        let _ = fs::write(queue_path, raw);
    }
}

pub fn enqueue_record(snapshots: Vec<AgentUsageSnapshot>) -> Option<QueuedUsageRecord> {
    let stats = get_storage_stats();
    if stats.is_ceiling_reached {
        log_message("Storage ceiling (25MB) reached. Enforce compaction.");
        compact_queue();
        let new_stats = get_storage_stats();
        if new_stats.is_ceiling_reached {
            log_message("Storage hard limit active. Record skipped for storage safety.");
            return None;
        }
    }

    let config = get_config();
    let mut records = read_queue();
    let record = QueuedUsageRecord {
        id: Uuid::new_v4().to_string(),
        timestamp: Utc::now().to_rfc3339(),
        user_id: config.user_id.clone().unwrap_or_else(|| "anonymous_user".to_string()),
        snapshots,
        synced: false,
        created_at: Utc::now().to_rfc3339(),
    };

    records.push(record.clone());
    write_queue(records);
    Some(record)
}

pub fn remove_synced_records(synced_ids: &[String]) {
    if synced_ids.is_empty() {
        return;
    }
    let mut records = read_queue();
    records.retain(|r| !synced_ids.contains(&r.id));
    write_queue(records);
    log_message(&format!("Cleaned up {} synchronized usage records.", synced_ids.len()));
}

pub fn compact_queue() {
    let mut records = read_queue();
    records.retain(|r| !r.synced);
    write_queue(records);
    log_message("Compacted local queue storage.");
}

fn check_and_rotate_logs() {
    let log_path = get_log_file_path();
    if !log_path.exists() {
        return;
    }
    if let Ok(meta) = fs::metadata(&log_path) {
        if meta.len() > 2 * 1024 * 1024 {
            let mut backup = log_path.clone();
            backup.set_extension("log.1");
            let _ = fs::copy(&log_path, backup);
            let _ = fs::write(&log_path, format!("[{}] Log rotated.\n", Utc::now().to_rfc3339()));
        }
    }
}
