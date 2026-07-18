import { mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { installClaudeSkill, installSkill } from "../src/install-skill.js";

describe("skill installer", () => {
  it("copies the packaged skill to a caller-selected Codex skill directory", () => {
    const root = mkdtempSync(join(tmpdir(), "learn-skill-"));
    const installed = installSkill(root);

    expect(installed).toBe(join(root, "learn"));
    expect(existsSync(join(installed, "SKILL.md"))).toBe(true);
    expect(existsSync(join(installed, "agents", "openai.yaml"))).toBe(true);
  });

  it("copies the same skill to a caller-selected Claude Code skill directory", () => {
    const root = mkdtempSync(join(tmpdir(), "learn-claude-skill-"));
    const installed = installClaudeSkill(root);

    expect(installed).toBe(join(root, "learn"));
    expect(existsSync(join(installed, "SKILL.md"))).toBe(true);
  });
});
