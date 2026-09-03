use serde::{Deserialize, Serialize};
use crate::config::{get_config, set_api_endpoint};
use crate::storage::{log_message, read_queue, remove_synced_records};

#[derive(Debug, Serialize)]
pub struct SyncPayload {
    pub user_id: Option<String>,
    pub user_email: Option<String>,
    pub records: Vec<crate::types::QueuedUsageRecord>,
    pub client_timestamp: String,
}

#[derive(Debug, Deserialize)]
pub struct RemoteConfigResponse {
    pub ok: Option<bool>,
    pub ingest_url: Option<String>,
}

#[derive(Debug)]
pub struct SyncResult {
    pub success: bool,
    pub synced_count: usize,
    pub endpoint: String,
    pub error: Option<String>,
}

pub fn fetch_remote_config() -> Option<String> {
    let cfg = get_config();
    if cfg.is_manual_endpoint_override {
        return Some(cfg.api_endpoint);
    }

    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(4))
        .build()
        .ok()?;

    if let Ok(resp) = client.get(&cfg.discovery_url).send() {
        if resp.status().is_success() {
            if let Ok(data) = resp.json::<RemoteConfigResponse>() {
                if let Some(ingest_url) = data.ingest_url {
                    log_message(&format!("Discovered remote active ingest endpoint: {}", ingest_url));
                    let _ = set_api_endpoint(&ingest_url, false);
                    return Some(ingest_url);
                }
            }
        }
    }

    Some(cfg.api_endpoint)
}

pub fn sync_usage() -> SyncResult {
    let cfg = get_config();

    if cfg.user_id.is_none() || cfg.user_id.as_deref() == Some("") {
        log_message("User is not logged in. Data sync paused until login.");
        return SyncResult {
            success: false,
            synced_count: 0,
            endpoint: cfg.api_endpoint,
            error: Some("User not logged in. Run 'mom-tracker login' to authenticate and start tracking.".to_string()),
        };
    }

    let active_endpoint = fetch_remote_config().unwrap_or_else(|| cfg.api_endpoint.clone());
    let records = read_queue();
    let pending: Vec<_> = records.into_iter().filter(|r| !r.synced).collect();

    if pending.is_empty() {
        return SyncResult {
            success: true,
            synced_count: 0,
            endpoint: active_endpoint,
            error: None,
        };
    }

    log_message(&format!("Attempting sync of {} record(s) to endpoint: {}", pending.len(), active_endpoint));

    let payload = SyncPayload {
        user_id: cfg.user_id.clone(),
        user_email: cfg.user_email.clone(),
        records: pending.clone(),
        client_timestamp: chrono::Utc::now().to_rfc3339(),
    };

    let client = match reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
    {
        Ok(c) => c,
        Err(e) => {
            return SyncResult {
                success: false,
                synced_count: 0,
                endpoint: active_endpoint,
                error: Some(e.to_string()),
            };
        }
    };

    let mut req = client.post(&active_endpoint).json(&payload);
    if let Some(token) = &cfg.auth_token {
        req = req.header("Authorization", format!("Bearer {}", token));
    }

    match req.send() {
        Ok(resp) => {
            let status = resp.status();
            if status.is_success() {
                let synced_ids: Vec<String> = pending.into_iter().map(|r| r.id).collect();
                let count = synced_ids.len();
                remove_synced_records(&synced_ids);
                log_message(&format!("Successfully synced {} usage record(s) to {}", count, active_endpoint));
                SyncResult {
                    success: true,
                    synced_count: count,
                    endpoint: active_endpoint,
                    error: None,
                }
            } else {
                let text = resp.text().unwrap_or_default();
                let err_msg = format!("HTTP {}: {}", status, text);
                log_message(&format!("Sync failed to {} - {}", active_endpoint, err_msg));
                SyncResult {
                    success: false,
                    synced_count: 0,
                    endpoint: active_endpoint,
                    error: Some(err_msg),
                }
            }
        }
        Err(err) => {
            let err_msg = err.to_string();
            log_message(&format!("Sync network error targeting {}: {}", active_endpoint, err_msg));
            SyncResult {
                success: false,
                synced_count: 0,
                endpoint: active_endpoint,
                error: Some(err_msg),
            }
        }
    }
}
