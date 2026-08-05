#!/usr/bin/env node
// Claude Code Stop-hook entrypoint. Forces a deterministic re-check of
// trigger-policy.md when this turn touched a substantive file, without
// itself judging recommend/optional/skip (that stays with the model).
// Non-blocking: uses hookSpecificOutput.additionalContext so the session
// continues normally and Claude simply sees the reminder as context.

import { readFileSync } from "node:fs";
import { REMINDER_TEXT, markNudged, shouldNudge } from "./lib/trigger-filter.mjs";

const FILE_TOOLS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit"]);

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

function touchedFilesSinceLastUserMessage(transcriptPath) {
  if (!transcriptPath) return [];
  let lines;
  try {
    lines = readFileSync(transcriptPath, "utf8").split("\n").filter(Boolean);
  } catch {
    return [];
  }
  const paths = new Set();
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    let entry;
    try {
      entry = JSON.parse(lines[index]);
    } catch {
      continue;
    }
    if (entry.type === "user" && !entry.isMeta) break;
    const content = entry.message?.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (block?.type === "tool_use" && FILE_TOOLS.has(block.name) && block.input?.file_path) {
        paths.add(block.input.file_path);
      }
    }
  }
  return [...paths];
}

function main() {
  const input = readStdin();
  if (input.stop_hook_active) {
    process.exit(0);
  }

  const projectDir = input.cwd || process.cwd();
  const touched = touchedFilesSinceLastUserMessage(input.transcript_path);

  if (!shouldNudge(projectDir, touched)) {
    process.exit(0);
  }

  markNudged(projectDir, touched);
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "Stop", additionalContext: REMINDER_TEXT },
    }),
  );
}

main();
