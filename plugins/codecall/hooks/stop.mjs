#!/usr/bin/env node
// Single Stop-hook entrypoint shared by both hosts' hooks.json. Codex sets
// its own PLUGIN_ROOT env var alongside a CLAUDE_PLUGIN_ROOT compatibility
// var; Claude Code only sets the latter. That's the signal used here to pick
// the correct per-host implementation at runtime — flagged for confirmation
// during the manual live-session dry run, since it isn't independently
// verifiable without a real Codex hook invocation.
const isCodex = Boolean(process.env.PLUGIN_ROOT);
await import(isCodex ? "./codex-stop.mjs" : "./claude-stop.mjs");
