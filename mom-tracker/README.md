# MOM Tracker 🤖📊

> Ultra-fast, privacy-first AI coding-agent token usage tracker CLI & daemon written in **pure Rust** for **Men of Matrix**.

MOM Tracker measures daily and monthly token usage across 5 supported AI coding agents (**OpenCode**, **Claude Code**, **Codex**, **Antigravity**, and **Cline**) under a single unified identity.

---

## ⚡ Key Highlights

- **Pure Rust Implementation**: Cold-starts in **< 5ms** with minimal RAM (~4 MB).
- **Zero Dependencies**: Compiles to a single standalone binary (`mom-tracker`).
- **Dynamic Endpoint Routing**: Automatically discovers current active backend URL via remote discovery.
- **Storage Safety Ceiling**: Enforces a strict **25 MB storage ceiling** to protect the user's filesystem.

---

## 🚀 Building & Installing

### Compile Release Binary
```bash
cargo build --release
```

### Install Executable Globally
```bash
cargo install --path .
```

---

## 🛠️ Commands Reference

| Command | Description |
| :--- | :--- |
| `mom-tracker login` | Authenticate CLI with user credentials & endpoint. |
| `mom-tracker install` | Install background daemon (`launchd` on macOS, `systemd` on Linux). |
| `mom-tracker uninstall` | Remove background daemon. |
| `mom-tracker status` | Display status, detected agents, storage safety, and pending sync queue. |
| `mom-tracker stats` | Display collected token usage breakdown per agent. |
| `mom-tracker agents` | List supported AI agents & detect active installations. |
| `mom-tracker storage` | Check storage usage against the **25 MB hard ceiling limit**. |
| `mom-tracker privacy` | Display privacy & data safety principles. |
| `mom-tracker config` | Get, set, list, or reset CLI settings (`api-endpoint`, etc.). |
| `mom-tracker detect` | Technical milestone: Scan local system for AI coding agents. |
| `mom-tracker collect` | Technical milestone: Manually trigger usage collection cycle. |
| `mom-tracker sync` | Manually flush pending queue to backend API. |
