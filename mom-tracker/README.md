# MOM Tracker

MOM Tracker is a command-line tool from Men of Matrix. It measures your daily AI coding-agent token usage and shows your rank on the Men of Matrix leaderboard.

MOM Tracker supports 5 AI coding agents:

- OpenCode
- Claude Code
- Codex
- Antigravity
- Cline

MOM Tracker links usage from all 5 agents to one account.

## What MOM Tracker does not do

MOM Tracker never reads or sends your source code. MOM Tracker never reads or sends your prompts. MOM Tracker only records token counts per agent, per day.

## Install

Run this command:

```bash
npm install -g mom-tracker
```

This command installs the `mom-tracker` binary and starts the background service. The background service runs automatically after this step. You do not need to start it yourself.

## Quick start

1. Sign in to your Men of Matrix account:
   ```bash
   mom-tracker login
   ```
   This command opens your browser. Sign in with Google to link the CLI to your account.
2. Check that MOM Tracker detects your installed agents:
   ```bash
   mom-tracker agents
   ```
3. Check tracker status and the pending sync queue:
   ```bash
   mom-tracker status
   ```

The background service now collects and sends your usage automatically. You do not need to run any more commands.

## Commands

| Command | What it does |
| :--- | :--- |
| `mom-tracker login` | Signs you in and links this device to your account. |
| `mom-tracker logout` | Signs you out and pauses collection and sync. |
| `mom-tracker install` | Starts the background service. `npm install` runs this command for you. |
| `mom-tracker uninstall` | Stops the background service. This command keeps your local config and data. |
| `mom-tracker status` | Shows sign-in status, detected agents, and the pending sync queue. |
| `mom-tracker stats` | Shows your total token usage per agent. |
| `mom-tracker agents` | Lists supported agents and shows which ones this command finds on your machine. |
| `mom-tracker storage` | Shows local storage use against the 25 MB limit. |
| `mom-tracker privacy` | Shows what data MOM Tracker collects and sends. |
| `mom-tracker config` | Gets, sets, lists, or resets CLI settings, for example `api-endpoint`. |
| `mom-tracker sync` | Sends any queued usage records to the server now. |
| `mom-tracker detect` | Scans this machine for supported agents. Diagnostic command. |
| `mom-tracker collect` | Runs one usage-collection cycle now. Diagnostic command. |

## Storage limit

MOM Tracker keeps local usage records in a queue until it sends them to the server. This queue has a 25 MB limit. Run `mom-tracker storage` to check current queue size against this limit.

## Uninstall

To stop the background service, run:
```bash
mom-tracker uninstall
```
This command keeps your local config and data.

To remove the CLI completely, run:
```bash
npm uninstall -g mom-tracker
```

## Build from source

Most users should install from npm. Contributors can build the Rust binary directly:

```bash
cargo build --release
cargo install --path .
```

The compiled binary starts in under 5 ms and uses about 4 MB of RAM.
