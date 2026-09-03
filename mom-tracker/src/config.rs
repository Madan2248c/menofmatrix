use std::fs;
use std::path::PathBuf;
use crate::types::TrackerConfig;

pub const DEFAULT_API_ENDPOINT: &str = "https://menofmatrix.vercel.app/api/v1/tracker";
pub const CANONICAL_DISCOVERY_URL: &str = "https://menofmatrix.vercel.app/api/v1/tracker/config";

pub fn get_storage_dir() -> PathBuf {
    let mut dir = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
    dir.push(".mom-tracker");
    if !dir.exists() {
        let _ = fs::create_dir_all(&dir);
    }
    dir
}

pub fn get_config_file_path() -> PathBuf {
    get_storage_dir().join("config.json")
}

pub fn default_config() -> TrackerConfig {
    TrackerConfig {
        user_id: None,
        user_email: None,
        auth_token: None,
        api_endpoint: DEFAULT_API_ENDPOINT.to_string(),
        discovery_url: CANONICAL_DISCOVERY_URL.to_string(),
        is_manual_endpoint_override: false,
        sync_interval_minutes: 10,
        max_storage_mb: 25,
        timezone: "UTC".to_string(),
    }
}

pub fn get_config() -> TrackerConfig {
    let path = get_config_file_path();
    let mut cfg = if path.exists() {
        fs::read_to_string(&path)
            .ok()
            .and_then(|raw| serde_json::from_str::<TrackerConfig>(&raw).ok())
            .unwrap_or_else(default_config)
    } else {
        default_config()
    };

    if let Ok(env_url) = std::env::var("MOM_TRACKER_API_URL") {
        if !env_url.trim().is_empty() {
            cfg.api_endpoint = env_url.trim().to_string();
            cfg.is_manual_endpoint_override = true;
        }
    }

    cfg
}

pub fn save_config(cfg: &TrackerConfig) -> Result<(), String> {
    let path = get_config_file_path();
    let raw = serde_json::to_string_pretty(cfg).map_err(|e| e.to_string())?;
    fs::write(path, raw).map_err(|e| e.to_string())
}

pub fn set_api_endpoint(url: &str, is_manual: bool) -> Result<TrackerConfig, String> {
    let mut cfg = get_config();
    let mut cleaned = url.trim().to_string();
    if !cleaned.starts_with("http://") && !cleaned.starts_with("https://") {
        cleaned = format!("https://{}", cleaned);
    }
    cfg.api_endpoint = cleaned;
    cfg.is_manual_endpoint_override = is_manual;
    save_config(&cfg)?;
    Ok(cfg)
}

pub fn reset_config() -> Result<TrackerConfig, String> {
    let def = default_config();
    save_config(&def)?;
    Ok(def)
}
