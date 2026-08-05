import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(fileURLToPath(new URL("..", import.meta.url)));
const pluginRoot = join(root, "plugins", "codecall");

function json(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

function frontmatter(path: string): Record<string, string> {
  const text = readFileSync(path, "utf8");
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error(`No frontmatter found in ${path}`);
  const fields: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const fieldMatch = line.match(/^([a-zA-Z]+):\s*(.*)$/);
    if (fieldMatch) fields[fieldMatch[1]] = fieldMatch[2].trim();
  }
  return fields;
}

describe("plugin package", () => {
  it("ships one canonical Codecall skill for both plugin hosts", () => {
    const skill = join(pluginRoot, "skills", "codecall", "SKILL.md");
    expect(existsSync(skill)).toBe(true);
    expect(existsSync(join(pluginRoot, "skills", "codecall", "agents", "openai.yaml"))).toBe(true);
    expect(existsSync(join(pluginRoot, "skills", "codecall", "references", "trigger-policy.md"))).toBe(true);

    const codex = json(join(pluginRoot, ".codex-plugin", "plugin.json"));
    const claude = json(join(pluginRoot, ".claude-plugin", "plugin.json"));
    expect(codex.name).toBe("codecall");
    expect(claude.name).toBe("codecall");
    expect(codex.version).toBe("1.1.0");
    expect(claude.version).toBe("1.1.0");
    expect(codex).not.toHaveProperty("hooks");
    expect(codex).not.toHaveProperty("mcpServers");
    expect(claude).not.toHaveProperty("hooks");
    expect(claude).not.toHaveProperty("mcpServers");
  });

  it("publishes matching marketplace entries", () => {
    const codexMarketplace = json(join(root, ".agents", "plugins", "marketplace.json"));
    const claudeMarketplace = json(join(root, ".claude-plugin", "marketplace.json"));
    expect(codexMarketplace.name).toBe("codecall");
    expect(claudeMarketplace.name).toBe("codecall");

    const codexPlugin = (codexMarketplace.plugins as Array<Record<string, unknown>>)[0];
    const claudePlugin = (claudeMarketplace.plugins as Array<Record<string, unknown>>)[0];
    expect(codexPlugin.name).toBe("codecall");
    expect((codexPlugin.source as Record<string, unknown>).path).toBe("./plugins/codecall");
    expect(claudePlugin.name).toBe("codecall");
    expect(claudePlugin.source).toBe("./plugins/codecall");
    expect(claudePlugin.version).toBe("1.1.0");
  });

  it("includes the canonical plugin in the npm package definition", () => {
    const packageJson = json(join(root, "package.json"));
    expect(packageJson.name).toBe("codecall");
    expect(packageJson.version).toBe("1.1.0");
    expect(packageJson.files).toContain("plugins/codecall");
    expect(packageJson.files).not.toContain("skill");
  });

  it("ships a well-formed Stop hook for both plugin hosts", () => {
    const hooksDir = join(pluginRoot, "hooks");
    const files = ["hooks.json", "stop.mjs", "claude-stop.mjs", "codex-stop.mjs", join("lib", "trigger-filter.mjs")];
    for (const file of files) expect(existsSync(join(hooksDir, file))).toBe(true);

    const hooks = json(join(hooksDir, "hooks.json"));
    const stopHooks = (hooks.hooks as Record<string, unknown>).Stop;
    expect(Array.isArray(stopHooks)).toBe(true);
    expect((stopHooks as unknown[]).length).toBeGreaterThan(0);
  });

  it("keeps hook scripts dependency-free and syntactically valid", () => {
    const scripts = ["stop.mjs", "claude-stop.mjs", "codex-stop.mjs", join("lib", "trigger-filter.mjs")].map((file) =>
      join(pluginRoot, "hooks", file),
    );
    for (const script of scripts) {
      expect(() => execFileSync("node", ["--check", script], { stdio: "pipe" })).not.toThrow();

      const source = readFileSync(script, "utf8");
      const imports = [...source.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]);
      for (const specifier of imports) {
        const isLocal = specifier.startsWith(".");
        const isNodeBuiltin = specifier.startsWith("node:");
        expect(isLocal || isNodeBuiltin).toBe(true);
      }
    }
  });

  it("ships a read-only Claude Code planner subagent", () => {
    const agentPath = join(pluginRoot, "agents", "codecall-planner.md");
    expect(existsSync(agentPath)).toBe(true);

    const fields = frontmatter(agentPath);
    expect(fields.name).toBe("codecall-planner");
    expect(fields.tools).not.toMatch(/\bWrite\b/);
    expect(fields.tools).not.toMatch(/\bEdit\b/);
  });

  it("keeps the SKILL.md description short and trigger-complete", () => {
    const fields = frontmatter(join(pluginRoot, "skills", "codecall", "SKILL.md"));
    expect(fields.description.length).toBeLessThan(200);
    expect(fields.description).toContain("/codecall");
    expect(fields.description).toContain("$codecall");
    expect(fields.description).toMatch(/quiz|explain/i);
    expect(fields.description).toMatch(/start learning/i);
    expect(fields.description).toMatch(/skip/i);
  });
});
