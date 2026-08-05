// Shared, dependency-free, host-agnostic core for the codecall Stop hook.
// This module never judges learning value (recommend/optional/skip) — that
// stays a semantic call for the model, driven by references/trigger-policy.md.
// Its only job is a cheap, deterministic pre-filter: was anything substantive
// touched, and have we already nudged about this exact change set?

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DOC_PATTERN = /(^|\/)(README|CHANGELOG|LICENSE|CONTRIBUTING)([._-].*)?$|\.mdx?$|(^|\/)docs\//i;
const LOCKFILE_PATTERN = /(^|\/)(package-lock\.json|npm-shrinkwrap\.json|pnpm-lock\.yaml|yarn\.lock|Cargo\.lock|go\.sum|poetry\.lock|Gemfile\.lock)$/i;
const TEST_PATTERN = /\.(test|spec)\.[^/]+$|(^|\/)(test|tests|__tests__)\//i;
const CONFIG_PATTERN = /(^|\/)\.[^/]+$|\.config\.[^/]+$|(^|\/)tsconfig[^/]*\.json$/i;

export function classifyPath(path) {
  if (!path) return "config";
  if (DOC_PATTERN.test(path)) return "doc";
  if (LOCKFILE_PATTERN.test(path)) return "lockfile";
  if (TEST_PATTERN.test(path)) return "test";
  if (CONFIG_PATTERN.test(path)) return "config";
  return "substantive";
}

export function hasSubstantiveChange(paths) {
  return paths.some((path) => classifyPath(path) === "substantive");
}

export function signatureFor(projectDir, paths) {
  const sortedPaths = [...new Set(paths)].sort();
  return createHash("sha256").update(`${projectDir}\n${sortedPaths.join("\n")}`).digest("hex");
}

function cachePathFor(projectDir) {
  const key = createHash("sha256").update(projectDir).digest("hex");
  return join(homedir(), ".codecall", "trigger-cache", `${key}.json`);
}

export function readMarker(projectDir) {
  try {
    return JSON.parse(readFileSync(cachePathFor(projectDir), "utf8")).signature;
  } catch {
    return undefined;
  }
}

export function writeMarker(projectDir, signature) {
  const path = cachePathFor(projectDir);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, JSON.stringify({ signature, updatedAt: new Date().toISOString() }), "utf8");
}

// Returns true only when there is a substantive change AND it differs from
// the last change set we already nudged about for this project.
export function shouldNudge(projectDir, touchedPaths) {
  if (!hasSubstantiveChange(touchedPaths)) return false;
  const signature = signatureFor(projectDir, touchedPaths);
  return readMarker(projectDir) !== signature;
}

export function markNudged(projectDir, touchedPaths) {
  writeMarker(projectDir, signatureFor(projectDir, touchedPaths));
}

export const REMINDER_TEXT =
  "A codecall-tracked implementation file changed this turn. Before your final response, " +
  "re-read plugins/codecall/skills/codecall/references/trigger-policy.md and apply it now: " +
  "show Start Learning / Skip only if the outcome is `recommend`; never teach without Start.";
