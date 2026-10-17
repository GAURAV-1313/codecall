import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error -- plain ESM build script without type declarations
import { MAP_DIR, loadMap, loadSources, parseCluster, renderIndex, validateMap } from "../scripts/backend-map.mjs";

type Cluster = { file: string; title: string; nodes: Array<{ id: string; requires: string[] }>; chars: number };

const sources = loadSources();
const VIDEO = "https://www.youtube.com/watch?v=eWM0CVReP04&t=1659s";
const DOC = "https://docs.stripe.com/api/idempotent_requests";

function card(id: string, { requires = "none", video = `[Sriniously · Backend from first principles #29 · 27:39](${VIDEO})`, doc = `[Stripe docs: Idempotent requests](${DOC})` } = {}): string {
  return [
    `## ${id}`,
    "",
    "- **Name:** Example concept",
    `- **Requires:** ${requires}`,
    "- **Signals:** `Idempotency-Key`, `ON CONFLICT DO NOTHING`",
    "- **Idea:** A short idea that ends with a period.",
    "- **Misconceptions:**",
    "  - First misconception.",
    "  - Second misconception.",
    "- **Checks:**",
    "  - What does your handler do twice?",
    "  - Which line stops the duplicate?",
    "- **Go deeper:**",
    ...[video, doc].filter(Boolean).map((link) => `  - ${link}`),
    "",
  ].join("\n");
}

function check(...cards: string[]): string[] {
  const text = `# Example\n\n${cards.join("\n")}`;
  return validateMap([{ ...parseCluster(text, "example.md"), chars: text.length }], sources);
}

describe("backend concept map", () => {
  const clusters = loadMap() as Cluster[];
  const nodes = clusters.flatMap((c) => c.nodes);

  it("passes every content, link and graph rule", () => {
    expect(validateMap(clusters, sources)).toEqual([]);
  });

  it("ships an index.md that matches the cluster files", () => {
    expect(readFileSync(join(MAP_DIR, "index.md"), "utf8")).toBe(renderIndex(clusters));
  });

  it("stays a useful size: enough concepts to be specific, few enough to stay cheap", () => {
    expect(nodes.length).toBeGreaterThanOrEqual(40);
    expect(nodes.length).toBeLessThanOrEqual(90);
  });

  it("is wired into the skill, the planner and the receipt", () => {
    const skillDir = join(MAP_DIR, "..", "..");
    const skill = readFileSync(join(skillDir, "SKILL.md"), "utf8");
    const planner = readFileSync(join(skillDir, "..", "..", "agents", "codecall-planner.md"), "utf8");
    const receipt = readFileSync(join(skillDir, "references", "receipt-template.html"), "utf8");
    expect(skill).toContain("references/backend-map/index.md");
    expect(skill).toMatch(/never bend a\s+concept to fit/);
    expect(planner).toContain("references/backend-map/index.md");
    expect(planner).toContain("[map: <id>|none]");
    expect(receipt).toContain('name="codecall-concepts"');
    expect(receipt).toContain('class="deeper"');
  });

  it("accepts a well-formed concept", () => {
    expect(check(card("good-concept"))).toEqual([]);
  });

  it("rejects a video link that does not start at a real chapter", () => {
    const bad = `[Sriniously · Backend from first principles #29 · 27:40](https://www.youtube.com/watch?v=eWM0CVReP04&t=1660s)`;
    expect(check(card("x", { video: bad })).join("\n")).toMatch(/chapter marks/);
  });

  it("rejects a video that is not in the source playlist", () => {
    const bad = `[Sriniously · Backend from first principles #29 · 0:00](https://www.youtube.com/watch?v=aaaaaaaaaaa&t=0s)`;
    expect(check(card("x", { video: bad })).join("\n")).toMatch(/not a video in the source playlist/);
  });

  it("rejects documentation hosts outside the allowlist", () => {
    expect(check(card("x", { doc: "[Blog](https://example.com/post)" })).join("\n")).toMatch(/not an allowed documentation host/);
  });

  it("requires a documentation link besides the video", () => {
    expect(check(card("x", { doc: "" })).join("\n")).toMatch(/documentation link besides the video/);
  });

  it("rejects unknown prerequisites and cycles", () => {
    expect(check(card("x", { requires: "`missing`" })).join("\n")).toMatch(/unknown id "missing"/);
    expect(check(card("a", { requires: "`b`" }), card("b", { requires: "`a`" })).join("\n")).toMatch(/prerequisite cycle/);
  });

  it("rejects unfilled placeholders", () => {
    expect(check(card("x").replace("A short idea that ends with a period.", "TODO.")).join("\n")).toMatch(/placeholder/);
  });
});
