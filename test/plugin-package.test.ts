import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(fileURLToPath(new URL("..", import.meta.url)));
const pluginRoot = join(root, "plugins", "codecall");

function json(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
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
});
