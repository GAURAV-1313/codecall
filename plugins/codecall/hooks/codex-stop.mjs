#!/usr/bin/env node
// Codex Stop-hook entrypoint. Same deterministic pre-filter as the Claude
// entrypoint, but Codex's Stop-hook transcript format isn't confirmed at
// authoring time, so touched-file detection uses `git diff` (optional —
// never required, matching the skill's own "never require Git" rule) rather
// than parsing the transcript. Codex's confirmed nudge mechanism is more
// intrusive than Claude's: decision:"block" forces one extra turn instead of
// silently injecting context. That tradeoff is deliberate, not an oversight.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { REMINDER_TEXT, markNudged, readMarker, shouldNudge, signatureFor } from "./lib/trigger-filter.mjs";

// Fixed sentinel path set used only when git is unavailable, so the marker
// can still deduplicate repeat nudges even though we can't tell what changed.
const NO_GIT_SENTINEL = ["__codecall_no_git__"];

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

function gitChangedFiles(projectDir) {
  try {
    return execFileSync("git", ["status", "--porcelain"], {
      cwd: projectDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split("\n")
      .map((line) => line.slice(3).trim())
      .map((path) => (path.includes(" -> ") ? path.split(" -> ").at(-1) : path))
      .filter(Boolean);
  } catch {
    return null; // no git repo, or git unavailable — never required
  }
}

function main() {
  const input = readStdin();
  if (input.stop_hook_active) {
    process.exit(0);
  }

  const projectDir = input.cwd || process.cwd();
  const changed = gitChangedFiles(projectDir);

  let nudge;
  if (changed === null) {
    // No git available: can't cheaply detect what changed, so nudge once
    // (fixed sentinel signature) and let the marker suppress repeats.
    nudge = readMarker(projectDir) !== signatureFor(projectDir, NO_GIT_SENTINEL);
    if (nudge) markNudged(projectDir, NO_GIT_SENTINEL);
  } else {
    nudge = shouldNudge(projectDir, changed);
    if (nudge) markNudged(projectDir, changed);
  }

  if (!nudge) process.exit(0);

  process.stdout.write(JSON.stringify({ decision: "block", reason: REMINDER_TEXT, continue: true }));
}

main();
