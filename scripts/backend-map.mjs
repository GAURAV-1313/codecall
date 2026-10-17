#!/usr/bin/env node
// Builds and validates the backend concept map that ships with the codecall skill.
//
// Source of truth: one Markdown file per cluster in MAP_DIR (everything except
// index.md). Each concept is a `## <id>` section with these bullet fields:
//
//   - **Name:** Human name
//   - **Requires:** none | `other-id`, `another-id`
//   - **Signals:** `code signal`, `another signal`
//   - **Idea:** One sentence in our own words.
//   - **Misconceptions:**
//     - ...
//   - **Checks:**
//     - ...?
//   - **Go deeper:**
//     - [Sriniously · Backend from first principles #13 · 42:48](https://www.youtube.com/watch?v=<id>&t=<sec>s)
//     - [Official docs title](https://<allowlisted host>/...)
//
// `node scripts/backend-map.mjs` regenerates index.md; `--check` validates the
// map and fails when index.md is stale. Content must be written from general
// knowledge in our own words: never paste or paraphrase video transcripts.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const MAP_DIR = join(root, "plugins", "codecall", "skills", "codecall", "references", "backend-map");
export const SOURCES_PATH = join(root, "test", "fixtures", "backend-map-sources.json");
export const INDEX_CHAR_BUDGET = 12_000;
export const CLUSTER_CHAR_BUDGET = 12_000;
const INDEX_SIGNALS = 4;

export const ALLOWED_DOC_HOSTS = new Set([
  "developer.mozilla.org", "www.rfc-editor.org", "datatracker.ietf.org", "httpwg.org",
  "www.postgresql.org", "cheatsheetseries.owasp.org", "owasp.org", "12factor.net",
  "spec.openapis.org", "learn.openapis.org", "www.openapis.org", "opentelemetry.io", "redis.io",
  "docs.docker.com", "kubernetes.io", "sre.google", "martinfowler.com", "docs.stripe.com",
  "docs.aws.amazon.com", "aws.amazon.com", "docs.github.com", "www.elastic.co", "nodejs.org",
  "go.dev", "docs.python.org", "oauth.net", "openid.net", "developer.hashicorp.com",
  "microservices.io", "cloud.google.com", "learn.microsoft.com", "web.dev", "prometheus.io",
  "www.cloudflare.com", "developers.cloudflare.com", "dora.dev", "testing.googleblog.com",
  "jwt.io", "www.enterpriseintegrationpatterns.com", "html.spec.whatwg.org",
]);

const SINGLE = { Name: "name", Requires: "requires", Signals: "signals", Idea: "idea" };
const LISTS = { Misconceptions: "misconceptions", Checks: "checks", "Go deeper": "deeper" };
const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const ticked = (s) => [...s.matchAll(/`([^`]+)`/g)].map((m) => m[1]);

/** Parse one cluster file into its title and concept nodes. */
export function parseCluster(text, file) {
  const title = (text.match(/^# (.+)$/m) ?? [])[1]?.trim() ?? "";
  const nodes = [];
  for (const section of text.split(/^## /m).slice(1)) {
    const [head, ...lines] = section.split("\n");
    const node = { id: head.trim(), file, name: "", requires: [], signals: [], idea: "", misconceptions: [], checks: [], deeper: [], unknown: [] };
    let list = null;
    for (const line of lines) {
      const field = line.match(/^- \*\*([^*]+):\*\*\s*(.*)$/);
      const item = line.match(/^ {2}- (.+)$/);
      if (field) {
        const [, key, value] = field;
        list = null;
        if (key in SINGLE) {
          const prop = SINGLE[key];
          if (prop === "requires") node.requires = value.trim() === "none" ? [] : ticked(value);
          else if (prop === "signals") node.signals = ticked(value);
          else node[prop] = value.trim();
        } else if (key in LISTS && value.trim() === "") list = LISTS[key];
        else node.unknown.push(key);
      } else if (item && list) {
        if (list === "deeper") {
          const link = item[1].match(/^\[([^\]]+)\]\((\S+)\)$/);
          node.deeper.push(link ? { text: link[1], url: link[2] } : { text: item[1], url: "" });
        } else node[list].push(item[1].trim());
      } else if (line.trim() !== "") list = null;
    }
    nodes.push(node);
  }
  return { file, title, nodes };
}

/** Load every cluster file in the map directory, sorted by file name. */
export function loadMap(dir = MAP_DIR) {
  const files = readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "index.md").sort();
  return files.map((file) => ({ ...parseCluster(readFileSync(join(dir, file), "utf8"), file), chars: readFileSync(join(dir, file), "utf8").length }));
}

export function loadSources(path = SOURCES_PATH) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function timestamp(seconds) {
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function validateLink(link, sources, where, errors) {
  let url;
  try { url = new URL(link.url); } catch { errors.push(`${where}: "${link.text}" has no valid URL`); return "invalid"; }
  if (url.protocol !== "https:") errors.push(`${where}: ${link.url} must use https`);
  if (url.hostname === "www.youtube.com") {
    const video = sources.videos[url.searchParams.get("v") ?? ""];
    const t = url.searchParams.get("t") ?? "";
    if (!video) { errors.push(`${where}: ${link.url} is not a video in the source playlist`); return "video"; }
    const seconds = /^\d+s$/.test(t) ? Number(t.slice(0, -1)) : NaN;
    if (!video.chapterStarts.includes(seconds)) errors.push(`${where}: ${link.url} must start at one of the video's chapter marks`);
    const expected = `Sriniously · Backend from first principles #${video.episode} · ${timestamp(seconds)}`;
    if (link.text !== expected) errors.push(`${where}: link text must be "${expected}"`);
    return "video";
  }
  if (!ALLOWED_DOC_HOSTS.has(url.hostname)) errors.push(`${where}: ${url.hostname} is not an allowed documentation host`);
  return "doc";
}

/** Return every rule violation in the map; an empty array means it is valid. */
export function validateMap(clusters, sources) {
  const errors = [];
  const nodes = clusters.flatMap((c) => c.nodes);
  const ids = new Map();
  for (const cluster of clusters) {
    if (!cluster.title) errors.push(`${cluster.file}: missing "# Title" heading`);
    if (cluster.nodes.length === 0) errors.push(`${cluster.file}: has no concepts`);
    if (cluster.chars > CLUSTER_CHAR_BUDGET) errors.push(`${cluster.file}: ${cluster.chars} chars exceeds ${CLUSTER_CHAR_BUDGET}`);
  }
  for (const node of nodes) {
    const where = `${node.file} ${node.id}`;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(node.id)) errors.push(`${where}: id must be kebab-case`);
    if (ids.has(node.id)) errors.push(`${where}: duplicate id (also in ${ids.get(node.id)})`);
    ids.set(node.id, node.file);
    if (node.unknown.length) errors.push(`${where}: unknown fields ${node.unknown.join(", ")}`);
    if (!node.name || node.name.length > 60) errors.push(`${where}: Name must be 1-60 chars`);
    if (node.signals.length < 2 || node.signals.length > 6) errors.push(`${where}: needs 2-6 backticked Signals`);
    for (const s of node.signals) if (s.length > 40) errors.push(`${where}: signal "${s}" is longer than 40 chars`);
    if (!node.idea || words(node.idea) > 35 || !node.idea.endsWith(".")) errors.push(`${where}: Idea must be one sentence of at most 35 words`);
    if (node.misconceptions.length < 2 || node.misconceptions.length > 3) errors.push(`${where}: needs 2-3 Misconceptions`);
    for (const m of node.misconceptions) if (words(m) > 30) errors.push(`${where}: misconception over 30 words`);
    if (node.checks.length < 2 || node.checks.length > 3) errors.push(`${where}: needs 2-3 Checks`);
    for (const c of node.checks) if (words(c) > 35 || !c.endsWith("?")) errors.push(`${where}: each check must be a question of at most 35 words`);
    if (node.deeper.length < 1 || node.deeper.length > 3) errors.push(`${where}: needs 1-3 Go deeper links`);
    const kinds = node.deeper.map((link) => validateLink(link, sources, where, errors));
    if (!kinds.includes("doc")) errors.push(`${where}: needs at least one documentation link besides the video`);
    if (kinds.filter((k) => k === "video").length > 1) errors.push(`${where}: at most one video link`);
    const text = [node.name, node.idea, ...node.misconceptions, ...node.checks].join(" ");
    if (/\b(TODO|TBD|FILL|lorem)\b/i.test(text)) errors.push(`${where}: contains placeholder text`);
  }
  for (const node of nodes) {
    for (const req of node.requires) {
      if (req === node.id) errors.push(`${node.file} ${node.id}: requires itself`);
      else if (!ids.has(req)) errors.push(`${node.file} ${node.id}: requires unknown id "${req}"`);
    }
  }
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const state = new Map();
  const visit = (id, path) => {
    if (state.get(id) === "done") return;
    if (state.get(id) === "active") { errors.push(`prerequisite cycle: ${[...path, id].join(" -> ")}`); return; }
    state.set(id, "active");
    for (const req of byId.get(id)?.requires ?? []) if (byId.has(req)) visit(req, [...path, id]);
    state.set(id, "done");
  };
  for (const id of byId.keys()) visit(id, []);
  const index = renderIndex(clusters);
  if (index.length > INDEX_CHAR_BUDGET) errors.push(`index.md: ${index.length} chars exceeds ${INDEX_CHAR_BUDGET}`);
  return errors;
}

/** Render the compact index the skill reads before choosing concepts. */
export function renderIndex(clusters) {
  const sections = clusters.flatMap((c) => [
    `## ${c.file}: ${c.title}`,
    "",
    "| id | requires | signals |",
    "| --- | --- | --- |",
    ...c.nodes.map((n) => `| ${n.id} | ${n.requires.join(", ") || "-"} | ${n.signals.slice(0, INDEX_SIGNALS).map((s) => `\`${s}\``).join(", ")} |`),
    "",
  ]);
  return [
    "# Backend concept map: index",
    "",
    "Generated by `scripts/backend-map.mjs`; edit the cluster files, not this one.",
    "",
    "Use only when the change touches server-side code. Match concepts by what the",
    "change actually does; signals are hints, not proof. Pick at most four, never",
    "force a match, and fall back to free-form concepts when nothing fits. Then read",
    "only the cluster files that hold the chosen ids.",
    "",
    ...sections,
  ].join("\n");
}

const invokedAsScript = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedAsScript) {
  const clusters = loadMap();
  const errors = validateMap(clusters, loadSources());
  const index = renderIndex(clusters);
  const indexPath = join(MAP_DIR, "index.md");
  if (process.argv.includes("--check")) {
    let current = "";
    try { current = readFileSync(indexPath, "utf8"); } catch {}
    if (current !== index) errors.push("index.md is stale: run node scripts/backend-map.mjs");
  } else if (errors.length === 0) {
    writeFileSync(indexPath, index);
  }
  for (const error of errors) console.error(`✗ ${error}`);
  const count = clusters.reduce((n, c) => n + c.nodes.length, 0);
  console.log(errors.length ? `${errors.length} problem(s) in ${count} concepts` : `ok: ${count} concepts in ${clusters.length} files`);
  process.exit(errors.length ? 1 : 0);
}
