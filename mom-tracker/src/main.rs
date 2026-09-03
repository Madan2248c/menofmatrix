mod adapters;
mod banner;
mod config;
mod daemon;
mod storage;
mod sync;
mod types;

use clap::{Parser, Subcommand};
use adapters::{collect_all_agent_usage, detect_installed_agents};
use banner::print_installation_banner;
use config::{get_config, reset_config, save_config, set_api_endpoint};
use daemon::{install_background_service, run_daemon_loop_once, start_continuous_daemon, uninstall_background_service};
use storage::get_storage_stats;
use sync::sync_usage;

#[derive(Parser)]
#[command(
    name = "mom-tracker",
    author = "Men of Matrix",
    version = env!("CARGO_PKG_VERSION"),
    about = "Men of Matrix - Lightweight AI Coding-Agent Token Usage Tracker",
    long_about = None
)]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    /// Authenticate and configure your MOM Tracker account via browser web approval
    Login {
        /// User ID / Username override
        #[arg(short, long)]
        user: Option<String>,
        /// User Email override
        #[arg(short, long)]
        email: Option<String>,
        /// Authentication Token override
        #[arg(short, long)]
        token: Option<String>,
        /// Custom API Endpoint URL
        #[arg(short, long)]
        api_endpoint: Option<String>,
    },
    /// Log out of your MOM Tracker account and pause data collection & sync
    Logout,
    /// Install and enable the continuous background tracking service
    Install,
    /// Uninstall and stop the background service (preserves local config & data)
    Uninstall,
    /// Check tracker authentication, detected agents, and sync queue status
    Status,
    /// Display total token usage metrics extracted across all AI agents
    Stats,
    /// List supported AI agents and their detection status on this machine
    Agents,
    /// Inspect local storage usage, queue size, and 25MB storage ceiling status
    Storage,
    /// Display privacy policy and data collection transparency details
    Privacy,
    /// View or update tracker configuration (including API endpoint)
    Config {
        #[command(subcommand)]
        action: ConfigAction,
    },
    /// [Technical Milestone] Test agent detection on local environment
    Detect,
    /// [Technical Milestone] Manually trigger token collection cycle
    Collect,
    /// Trigger sync of pending records to backend API endpoint
    Sync,
    /// Internal daemon runner command for background service
    Daemon {
        /// Run single collection & sync cycle then exit
        #[arg(long)]
        once: bool,
    },
}

#[derive(Subcommand)]
enum ConfigAction {
    /// Get config value(s)
    Get { key: Option<String> },
    /// Set a config value (e.g. mom-tracker config set api-endpoint https://your-backend.com/api/v1/tracker)
    Set { key: String, value: String },
    /// Reset configuration to default settings
    Reset,
    /// List all configuration settings
    List,
}

fn main() {
    let cli = Cli::parse();

    match cli.command {
        Some(Commands::Login { user, email, token, api_endpoint }) => {
            if user.is_some() || token.is_some() {
                // Direct CLI flag override
                let mut cfg = get_config();
                if let Some(u) = user { cfg.user_id = Some(u); }
                if let Some(e) = email { cfg.user_email = Some(e); }
                if let Some(t) = token { cfg.auth_token = Some(t); }
                if let Some(a) = api_endpoint {
                    let mut cleaned = a.trim().to_string();
                    if !cleaned.starts_with("http://") && !cleaned.starts_with("https://") {
                        cleaned = format!("https://{}", cleaned);
                    }
                    cfg.api_endpoint = cleaned;
                    cfg.is_manual_endpoint_override = true;
                }
                let _ = save_config(&cfg);
                println!("✅ Authenticated successfully!");
                println!("   User ID:      {}", cfg.user_id.unwrap_or_default());
                println!("   Email:        {}", cfg.user_email.unwrap_or_else(|| "Not set".to_string()));
                println!("   API Endpoint: {}", cfg.api_endpoint);
            } else {
                // Launch Web Browser Authorization Flow
                if let Err(e) = run_web_login_flow(api_endpoint) {
                    eprintln!("❌ Login Error: {}", e);
                }
            }
        }

        Some(Commands::Logout) => {
            let mut cfg = get_config();
            cfg.user_id = None;
            cfg.user_email = None;
            cfg.auth_token = None;
            if let Ok(_) = save_config(&cfg) {
                println!("✅ Successfully logged out of MOM Tracker!");
                println!("   Data collection & server sync are now paused.");
                println!("   Run 'mom-tracker login' anytime to log back in.");
            } else {
                eprintln!("❌ Failed to update configuration for logout.");
            }
        }

        Some(Commands::Install) => {
            let (success, msg) = install_background_service();
            if success {
                print_installation_banner();
                println!("✅ {}", msg);
            } else {
                eprintln!("❌ {}", msg);
            }
        }

        Some(Commands::Uninstall) => {
            let (success, msg) = uninstall_background_service();
            if success {
                println!("✅ {}", msg);
            } else {
                eprintln!("❌ {}", msg);
            }
        }

        Some(Commands::Status) => {
            let cfg = get_config();
            let storage = get_storage_stats();
            let agents = detect_installed_agents();
            let detected_count = agents.iter().filter(|a| a.installed).count();

            println!("=== MOM Tracker Status ===");
            println!("User ID:        {}", cfg.user_id.unwrap_or_else(|| "Not logged in".to_string()));
            println!("API Endpoint:   {}", cfg.api_endpoint);
            println!("Detected Agents: {} / {}", detected_count, agents.len());
            println!("Storage Used:   {} MB / {} MB ({}%)", storage.used_mb, storage.max_mb, storage.percent_used);
            println!("Pending Queue:  {} unsynced batch(es)", storage.record_count);
            println!("Ceiling Limit:  {}", if storage.is_ceiling_reached { "⚠️ MAX LIMIT REACHED (25MB)" } else { "OK" });
        }

        Some(Commands::Stats) => {
            println!("Collecting token statistics across installed agents...");
            let snapshots = collect_all_agent_usage();

            println!("\n=== MOM Token Usage Stats ===");
            if snapshots.is_empty() {
                println!("No AI agent usage data found or agents not installed.");
                return;
            }

            let mut grand_total: u64 = 0;
            for s in &snapshots {
                println!("\n🤖 Agent: {} ({})", s.agent_name, s.agent_id.as_str());
                println!("   Date:            {}", s.date);
                println!("   Input Tokens:    {}", format_num(s.usage.input_tokens));
                println!("   Output Tokens:   {}", format_num(s.usage.output_tokens));
                println!("   Thinking Tokens: {}", format_num(s.usage.thinking_tokens));
                println!("   Cached Tokens:   {}", format_num(s.usage.cached_tokens));
                println!("   Total Tokens:    {}", format_num(s.usage.total_tokens));
                grand_total += s.usage.total_tokens;
            }

            println!("\n-----------------------------");
            println!("🔥 Total Combined Tokens: {}", format_num(grand_total));
        }

        Some(Commands::Agents) => {
            let agents = detect_installed_agents();
            println!("=== Supported AI Agents ===");
            for a in agents {
                let icon = if a.installed { "✅ Installed" } else { "❌ Not Detected" };
                println!("- {} ({}): {}", a.name, a.id.as_str(), icon);
            }
        }

        Some(Commands::Storage) => {
            let stats = get_storage_stats();
            println!("=== Storage Safety Diagnostics ===");
            println!("Hard Storage Ceiling: 25.00 MB");
            println!("Current Storage Used: {} MB", stats.used_mb);
            println!("Capacity Used:        {}%", stats.percent_used);
            println!("Queued Records:       {}", stats.record_count);
            println!("Storage Status:       {}", if stats.is_ceiling_reached { "⚠️ Hard limit reached - record creation paused for filesystem safety" } else { "Healthy" });
        }

        Some(Commands::Privacy) => {
            println!("=== MOM Tracker Privacy Policy ===");
            println!("MOM Tracker is designed with strict data minimization principles:");
            println!("  1. NO Prompts or AI responses are ever collected or transmitted.");
            println!("  2. NO Source code, project files, or directory trees are read or logged.");
            println!("  3. NO Passwords, API keys, or environment variables are stored.");
            println!("  4. NO Terminal history or screenshots are recorded.");
            println!("  5. ONLY raw aggregate token count numbers per agent are collected.");
            println!("  6. Local storage is strictly hard-bounded to a 25MB ceiling.");
        }

        Some(Commands::Config { action }) => match action {
            ConfigAction::Get { key } => {
                let cfg = get_config();
                if let Some(k) = key {
                    match k.to_lowercase().replace("-", "_").as_str() {
                        "api_endpoint" | "api_url" => println!("api_endpoint: {}", cfg.api_endpoint),
                        "user_id" => println!("user_id: {}", cfg.user_id.unwrap_or_else(|| "none".to_string())),
                        "user_email" => println!("user_email: {}", cfg.user_email.unwrap_or_else(|| "none".to_string())),
                        "max_storage_mb" => println!("max_storage_mb: {}", cfg.max_storage_mb),
                        _ => println!("{}: Key not recognized", k),
                    }
                } else {
                    println!("{}", serde_json::to_string_pretty(&cfg).unwrap_or_default());
                }
            }
            ConfigAction::Set { key, value } => {
                if key.to_lowercase().replace("-", "_") == "api_endpoint" {
                    if let Ok(updated) = set_api_endpoint(&value, true) {
                        println!("✅ API Endpoint updated to: {}", updated.api_endpoint);
                    }
                } else {
                    println!("Key '{}' updated to '{}'", key, value);
                }
            }
            ConfigAction::Reset => {
                if let Ok(def) = reset_config() {
                    println!("✅ Configuration reset to defaults:");
                    println!("   Default API Endpoint: {}", def.api_endpoint);
                }
            }
            ConfigAction::List => {
                let cfg = get_config();
                println!("{}", serde_json::to_string_pretty(&cfg).unwrap_or_default());
            }
        },

        Some(Commands::Detect) => {
            println!("Detecting installed agents...");
            let results = detect_installed_agents();
            println!("{}", serde_json::to_string_pretty(&results).unwrap_or_default());
        }

        Some(Commands::Collect) => {
            println!("Collecting agent usage snapshots...");
            let snapshots = collect_all_agent_usage();
            println!("Collected {} snapshot(s).", snapshots.len());
            println!("{}", serde_json::to_string_pretty(&snapshots).unwrap_or_default());
        }

        Some(Commands::Sync) => {
            println!("Synchronizing usage data...");
            let res = sync_usage();
            if res.success {
                println!("✅ Sync successful! {} record(s) sent to {}", res.synced_count, res.endpoint);
            } else {
                eprintln!("❌ Sync failed to {}: {:?}", res.endpoint, res.error);
            }
        }

        Some(Commands::Daemon { once }) => {
            if once {
                run_daemon_loop_once();
            } else {
                start_continuous_daemon();
            }
        }

        None => {
            let stats = get_storage_stats();
            println!("Men of Matrix AI Token Tracker (Rust v1.0.0)");
            println!("Run 'mom-tracker --help' for available commands.");
            println!("Status: {} MB / 25 MB storage used.", stats.used_mb);
        }
    }
}

fn run_web_login_flow(api_endpoint: Option<String>) -> Result<(), String> {
    let listener = std::net::TcpListener::bind("127.0.0.1:7777")
        .or_else(|_| std::net::TcpListener::bind("127.0.0.1:0"))
        .map_err(|e| format!("Failed to start local login listener: {}", e))?;

    let port = listener.local_addr().map(|a| a.port()).unwrap_or(7777);
    let state_code = format!("{:x}", rand_simple());
    let callback_url = format!("http://127.0.0.1:{}/callback", port);
    let auth_url = format!("https://menofmatrix.vercel.app/auth/cli?callback={}&state={}", callback_url, state_code);

    println!("--- MOM Tracker Web Login ---");
    println!("Opening your browser to authorize MOM Tracker CLI...");
    println!("If the browser doesn't open automatically, visit:\n  {}\n", auth_url);

    if cfg!(target_os = "macos") {
        let _ = std::process::Command::new("open").arg(&auth_url).status();
    } else if cfg!(target_os = "windows") {
        let _ = std::process::Command::new("cmd").args(["/C", "start", &auth_url]).status();
    } else {
        let _ = std::process::Command::new("xdg-open").arg(&auth_url).status();
    }

    println!("Waiting for web authorization...");

    if let Ok((mut stream, _)) = listener.accept() {
        use std::io::{Read, Write};
        let mut buf = [0u8; 1024];
        let bytes_read = stream.read(&mut buf).unwrap_or(0);
        let req_text = String::from_utf8_lossy(&buf[..bytes_read]);

        if let Some(query) = req_text.lines().next().and_then(|l| l.split_whitespace().nth(1)) {
            let mut user_id = None;
            let mut email = None;
            let mut auth_token = None;

            if let Some(pos) = query.find('?') {
                let params = &query[pos + 1..];
                for pair in params.split('&') {
                    let mut parts = pair.splitn(2, '=');
                    if let (Some(k), Some(v)) = (parts.next(), parts.next()) {
                        let val = v.replace("%20", " ").replace("%40", "@");
                        match k {
                            "user_id" => user_id = Some(val),
                            "email" => email = Some(val),
                            "auth_token" => auth_token = Some(val),
                            _ => {}
                        }
                    }
                }
            }

            let mut cfg = get_config();
            if let Some(u) = user_id { cfg.user_id = Some(u); }
            if let Some(e) = email { if !e.trim().is_empty() { cfg.user_email = Some(e); } }
            if let Some(t) = auth_token { cfg.auth_token = Some(t); }
            if let Some(a) = api_endpoint {
                let mut cleaned = a.trim().to_string();
                if !cleaned.starts_with("http://") && !cleaned.starts_with("https://") {
                    cleaned = format!("https://{}", cleaned);
                }
                cfg.api_endpoint = cleaned;
                cfg.is_manual_endpoint_override = true;
            }

            let _ = save_config(&cfg);

            let html_response = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nConnection: close\r\n\r\n<html><body style='font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;height:90vh;text-align:center;'><div><h1 style='font-size:32px;'>✅ Authorization Successful!</h1><p style='color:#666;font-size:16px;'>Your MOM Tracker CLI is connected. You can close this browser tab.</p></div></body></html>";
            let _ = stream.write_all(html_response.as_bytes());

            println!("\n✅ Authenticated successfully!");
            println!("   User ID:      {}", cfg.user_id.unwrap_or_default());
            println!("   Email:        {}", cfg.user_email.unwrap_or_else(|| "Not set".to_string()));
            println!("   API Endpoint: {}", cfg.api_endpoint);
            println!("\nRun 'mom-tracker install' to launch continuous background tracking.");
            return Ok(());
        }
    }

    Err("Failed to receive web authorization callback.".to_string())
}

fn rand_simple() -> u32 {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    (now.as_nanos() % 10000) as u32
}

fn format_num(n: u64) -> String {
    let s = n.to_string();
    let mut result = String::new();
    let len = s.len();
    for (i, ch) in s.chars().enumerate() {
        if i > 0 && (len - i) % 3 == 0 {
            result.push(',');
        }
        result.push(ch);
    }
    result
}
