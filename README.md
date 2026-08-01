# codecall

`codecall` is an agent-backed skill for Codex and Claude Code that turns a
completed implementation into a short, evidence-grounded, adaptive learning
session. It uses the active coding agent that already understands the task and
repository—there is no additional model call, no API key, and no code upload
to any external service.

The MVP deliberately teaches and checks understanding one step at a time:

```text
collect minimal context → recommend → confidence → lesson → one check-in
                                              ↑                 ↓
                                              └── reinforce / advance
```

It does not throw a fixed quiz at the user. A normal session covers 2–4 related
concepts, using two checks per concept: a real-world-to-technical mapping and a
technical application or tradeoff question. A wrong answer produces targeted
reinforcement and a fresh equivalent check-in; correct answers unlock the next
prerequisite-ready learning step.

## Requirements

- **Codex or Claude Code**, installed and working. `codecall` is a skill that
  runs inside one of these agents—it is not a standalone chatbot.
- **Node.js 20+**, but only if you use the npm standalone install path or the
  local deterministic CLI demo below. The Codex and Claude Code plugin paths
  need no Node.js on your machine.
- No API key, no account, no signup, and no network access at any point.

## Quickstart

Pick exactly one install path. All three end up invoking the same skill.

| You use | Install | Invoke |
| --- | --- | --- |
| Codex | [Codex plugin](#codex-plugin) | `$codecall` |
| Claude Code | [Claude Code plugin](#claude-code-plugin) | `/codecall:codecall` |
| Either, without a plugin marketplace | [npm standalone](#npm-standalone-skill) | `$codecall` (Codex) or `/codecall` (Claude) |

`codecall` is not yet listed in either agent's built-in, searchable plugin
directory—see [Getting listed in curated marketplaces](#getting-listed-in-curated-marketplaces).
Until then, every install path below requires running the exact command shown
once; browsing or searching inside Codex/Claude Code will not surface it.

### Codex plugin

```bash
codex plugin marketplace add https://github.com/GAURAV-1313/codecall
codex plugin add codecall@codecall
```

You should see `Added plugin `codecall` from marketplace `codecall`.`. Restart
Codex or open a new task, then invoke `$codecall`.

### Claude Code plugin

```text
/plugin marketplace add https://github.com/GAURAV-1313/codecall
/plugin install codecall@codecall
/reload-plugins
```

You should see `Successfully installed plugin: codecall@codecall`. The
marketplace plugin command is namespaced: `/codecall:codecall`.

### npm standalone skill

```bash
npm install -g codecall
```

The global install automatically copies the shared skill to both
`~/.codex/skills/codecall/` and `~/.claude/skills/codecall/`. Restart the
relevant coding agent or open a new task to reload it. The standalone Claude
skill keeps the short `/codecall` command instead of the namespaced one.

The current release is [`codecall@1.1.0`](https://www.npmjs.com/package/codecall).
To update a previous global installation:

```bash
npm update -g codecall
```

### Verify it worked

Invoke the command for your install path (`$codecall`, `/codecall:codecall`,
or `/codecall`) inside a project where you've just finished some work. You
should see a short, non-blocking prompt like:

```text
Implementation completed.
Learning opportunity: <implementation-specific reason>
Estimated learning time: <N> minutes

Start Learning / Skip
```

If nothing happens, see [Troubleshooting](#troubleshooting) below.

## Using it day to day

After Codex or Claude Code completes an implementation, invoke the command for
your install path. The skill uses the existing conversation and the coding
agent's recent edits—it does not require a Git repository, a diff, or any
uncommitted changes; Git is only used opportunistically when present.

It first presents a Start/Skip recommendation. After Start, it asks your
confidence (`expert`, `comfortable`, `heard_of_it`, `never_learned`), then
teaches one implementation-specific concept and asks one reasoning question at
a time. Your answer determines whether it reinforces, deepens, or advances. It
finishes with concepts covered, weak areas, and an estimated session mastery,
plus implementation-grounded points to remember and only the relevant edge
cases to check before applying the pattern in another project.

The shared skill source—what actually runs during a session—is in
[`plugins/codecall/skills/codecall/SKILL.md`](plugins/codecall/skills/codecall/SKILL.md).

## Turning on automatic recommendations (optional)

By default you invoke `codecall` manually after finishing work. To have Codex
or Claude Code *offer* the Start/Skip prompt on its own after a meaningful
implementation, copy the matching template into your project:

- Codex: copy [`references/AGENTS.codecall.md`](plugins/codecall/skills/codecall/references/AGENTS.codecall.md)
  into `AGENTS.md`.
- Claude Code: copy [`references/CLAUDE.codecall.md`](plugins/codecall/skills/codecall/references/CLAUDE.codecall.md)
  into `CLAUDE.md`.

Both templates reduce to this rule:

```md
Before the normal final response for a completed implementation, read the
codecall skill's references/trigger-policy.md and evaluate the change. Show Start
Learning / Skip only for a `recommend` outcome; never teach without Start.
```

The policy is intentionally selective: it recommends only when an implementation
has one strong signal (for example a security boundary, integration, public
contract, or architecture decision) or two moderate signals (such as a reusable
pattern plus operational behavior). It skips cosmetic, documentation-only,
mechanical, generated-only, dependency-only, and ordinary test-only work—see
the full policy in
[`references/trigger-policy.md`](plugins/codecall/skills/codecall/references/trigger-policy.md).
A runtime-local fingerprint prevents showing the same card twice in one agent
session; nothing is persisted across sessions or projects. Manual invocation
(`$codecall`, `/codecall:codecall`, or `/codecall`) always stays available
regardless of this policy.

## Privacy

- No API key, account, or signup at any step.
- No external model call and no code upload: the session runs entirely inside
  the coding agent (Codex or Claude Code) you already have open, using the
  conversation and files it already has access to.
- No cross-session or cross-project learner history is kept. The only state is
  an in-memory concept fingerprint for the current agent session, used solely
  to avoid showing a duplicate recommendation card.
- Git is read opportunistically when useful and is never required.

## Local deterministic CLI (optional demo, not the product path)

```bash
npm install -g codecall
codecall --task "Add OAuth protected routes" --from-git
```

This is a local, deterministic, offline demonstration runtime with fixed
example workers—useful for trying the session flow without an agent attached,
or for tests. It is **not** the agent-backed product experience: use
`$codecall`, `/codecall:codecall`, or `/codecall` for that. Run `codecall --help`
for the full option list (currently `--task`, `--from-git`, `--help`/`-h`).

## Use it programmatically

```ts
import { codecall } from "codecall";

const implementation = {
  task: "Protect account routes using JWT authentication middleware.",
  changedFiles: [{
    path: "src/routes.ts",
    summary: "Adds authentication middleware before account handlers."
  }]
};

const runtime = codecall(implementation);
const session = await runtime.start(implementation);

runtime.decide(session, true);                 // developer chose Start Learning
await runtime.setConfidence(session, "heard_of_it");

// Render session.currentQuestion. On a user answer:
await runtime.answer(session, "causal");
```

Providers render `runtime.history(session.id)` as their native UI: `/codecall`, a
tool call, or a non-blocking post-task recommendation. Core workers never
depend on a provider SDK.

## What ships in v1.1.0

- append-only, typed session events and an explicit state machine;
- progressive minimal context represented as evidence references;
- explainable opportunity scoring based on concepts and architecture signals,
  not LOC;
- separated concept categories, dependency-aware planning, and a bounded plan;
- an adaptive teach → one MCQ → evaluate → reinforce/advance loop;
- final transfer guidance: points to remember plus cross-project edge cases;
- one shared skill installed for Codex and Claude Code;
- Codex and Claude Code marketplace plugins backed by the same shared source;
- an explainable strong/moderate auto-recommendation policy with session-local
  duplicate suppression;
- pluggable worker and documentation-provider contracts;
- in-memory and caller-owned JSONL event stores;
- deterministic default workers suitable for local demonstration and tests.

The included deterministic workers support local tests and the terminal demo.
The installed agent skill is the production path: its reasoning, concept
selection, teaching, question generation, and evaluation are performed by the
active coding agent in the existing conversation.

## Troubleshooting

**`codecall` doesn't show up when I search or browse plugins in Codex/Claude
Code.** Expected—it isn't in either agent's curated/searchable directory yet
(see below). Install it with the exact `marketplace add <url>` command from
the Quickstart above; after that it works normally.

**Which command do I type—`$codecall`, `/codecall:codecall`, or `/codecall`?**
It depends on how you installed it: `$codecall` for Codex (either install
path), `/codecall:codecall` for the Claude Code marketplace plugin, `/codecall`
for the npm standalone skill in Claude Code. The Quickstart table above maps
each install path to its command.

**I installed it but the command does nothing.** Restart the agent or start a
new task/conversation so it reloads installed plugins/skills—an already-open
session won't pick up a new install.

**Does this ever call an external API or upload my code?** No. See
[Privacy](#privacy).

**I updated the plugin/package but still see old behavior.** See
[Plugin development](#plugin-development) and
[Development](#development) below for the exact refresh commands.

## Development

```bash
npm install
npm run build
npm test
```

### Plugin development

The canonical plugin lives in `plugins/codecall/`. Validate it with the
Claude Code CLI before release:

```bash
claude plugin validate ./plugins/codecall
```

If you have OpenAI's `plugin-creator` skill installed locally, its
`validate_plugin.py` script can validate the same directory for Codex; the
path is local to that skill's install and isn't part of this repo.

After updating the Claude marketplace plugin, users refresh it with
`/plugin marketplace update codecall` and `/reload-plugins`. Codex users refresh
the configured marketplace with `codex plugin marketplace upgrade codecall` and
reinstall `codecall@codecall` if needed.

### Getting listed in curated marketplaces

The Quickstart above works today via `marketplace add <this-repo-url>`, but
`codecall` is not yet listed in either agent's built-in, searchable directory.
Listing there is a separate, manual submission to each vendor:

**Claude Code** — submit via the
[Plugin Directory Submission Form](https://clau.de/plugin-directory-submission)
for inclusion in `claude-plugins-official` or the community-reviewed
`claude-community` marketplace. The repo already satisfies the required
structure (`plugins/codecall/.claude-plugin/plugin.json`, README, homepage).
Note the plugin `name` becomes immutable once accepted.

**Codex** — submit through the OpenAI Platform plugin portal at
`platform.openai.com/plugins`, which requires an org with "Apps Management:
Write" permission and a verified identity. Since `codecall` has no MCP
server, this is a skills-only submission: listing copy, support/privacy/terms
URLs, and a minimum of five positive and three negative test cases (prompt,
expected behavior, result shape). Review is asynchronous with no guaranteed
timeline.

## License

[MIT](LICENSE)

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full design, privacy posture,
event model, state machine, and planned provider integrations.
