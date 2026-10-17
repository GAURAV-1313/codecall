# codecall

`npx skills add GAURAV-1313/codecall` · Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Kiro, Copilot · no API key, nothing uploaded

![A codecall receipt: the change in a line, each idea marked could explain or could not, a score of 3 of 4](https://raw.githubusercontent.com/GAURAV-1313/codecall/main/docs/receipt.png)

**codecall quizzes you on the code the agent just wrote.** When an
implementation lands, it offers a four-minute session: it teaches the 2 to 4
ideas behind the change using your actual code, checks each one with two
questions, and ends with a one-page receipt you can keep or post. No API key,
nothing uploaded, nothing remembered unless you keep the receipt.

## Install

```bash
npx skills add GAURAV-1313/codecall
```

Then type `/codecall` (or `$codecall` in Codex) after your agent finishes
something. You are always asked **Start Learning / Skip** first.

Want it to *offer* automatically after meaningful changes, not just when you
ask? Install the plugin instead; it adds a small local hook that reminds the
agent to check, and never decides for you:

```text
/plugin marketplace add https://github.com/GAURAV-1313/codecall
/plugin install codecall@codecall
```

(Codex: `codex plugin marketplace add https://github.com/GAURAV-1313/codecall`
then `codex plugin add codecall@codecall`. The plugin's command is
`/codecall:codecall` in Claude Code.) `npm install -g codecall` also works and
installs the skill for both Codex and Claude Code.

## What a session looks like

Say your agent just added login to your app.

```text
You: /codecall

codecall: Implementation completed.
          Learning opportunity: this adds authentication middleware and a
          new security boundary.
          Estimated learning time: 4 minutes

          Start Learning / Skip

You: Start Learning

codecall: How confident are you with authentication middleware?
          [ Expert / Comfortable / Heard of it / Never learned ]

You: Heard of it

codecall: Let's start with why every request now passes through a check
          before reaching your account routes...
          (explains the idea in plain terms, using YOUR actual code)

          Quick check: if someone sends a request without logging in,
          what should happen?

You: (answer)

codecall: (tells you if you're right, and why, then moves to the next idea)

...

codecall: Receipt: ./codecall/0007-auth-middleware.html
          Could explain 3 of 4. Keep it, print it, or post it.
```

The receipt is one screen: the change in a line, each idea marked ✅ could
explain or ❌ could not, the score, three points to remember, and the edge
cases to check before you reuse the pattern somewhere else.

It is not just for auth. Retry logic with backoff, a new database index, a
cache layer, a webhook handler: anything with a *why* behind it gets the same
short format, grounded in what was actually built.

## Why it exists

It is easy to accept code from an AI assistant without fully understanding it.
Reading the diff back is not the same as being asked about it. codecall asks,
right after the change lands, while the reasons are still fresh, and leaves a
receipt you can return to.

## How the score is measured

Each session covers 2 to 4 ideas. An idea counts as *could explain* when you
answer both of its checks correctly without a reteach. The score is `N of M`
ideas, nothing else: no time-on-task, no mastery claim, no guess at what you
would have known anyway. Earlier receipts in `./codecall/` add a streak line
(sessions this week, running explain rate) and nothing more.

## Backend concept map

For server-side changes, codecall uses a small built-in map of about 80
backend concepts: HTTP, auth, databases, caching, queues, webhooks, real-time,
storage, testing and delivery. It gives concepts stable names, orders them by
what you need to know first, and supplies known misconceptions. You never see
the map. If a change matches nothing in it, codecall works exactly as before.

When you miss a mapped concept, the receipt adds one **Go deeper** line: the
matching chapter of Sriniously's free
[Backend from first principles](https://www.youtube.com/playlist?list=PLui3EUkuMTPgZcV0QhQrOcwMPcBCcd_Q1)
series, plus an official reference (MDN, OWASP, PostgreSQL and similar). The
map's wording is codecall's own and links to the videos; it does not copy
them. codecall is not affiliated with or endorsed by the series' creator.

## Privacy

- No API key, no account, no signup, no network call.
- It uses the agent and conversation you already have open. There is no
  separate model call.
- The receipt is the only thing it writes, into `./codecall/` in your
  project. Delete the folder to forget every session.
- The plugin's automatic-offer script runs entirely on your machine and only
  ever adds a text reminder; it cannot edit files or run commands.
- On the Claude Code plugin, the read-only planning step runs in an isolated
  helper so it does not fill your main conversation. It can only read files
  and never talks to you.

## Troubleshooting

**Nothing happens after installing.** Restart the agent or start a new
session; an open session does not pick up a fresh install.

**Which command?** `/codecall` after `npx skills add` or `npm install -g`;
`/codecall:codecall` for the Claude Code plugin; `$codecall` in Codex.

**The plugin asked me to trust something.** That is the one-time review for
the small local hook behind the automatic offer. Decline it and codecall still
works; you type the command yourself.

## For developers

```bash
npm install
npm run build
npm test
claude plugin validate ./plugins/codecall
```

The backend concept map lives in
`plugins/codecall/skills/codecall/references/backend-map/`, one Markdown file
per cluster. Edit those files, then run `node scripts/backend-map.mjs` to
validate them and regenerate `index.md`; `npm test` fails on a stale index, a
broken prerequisite, a timestamp that is not a real chapter start, or a link
outside the documentation allowlist.

The canonical skill lives in `plugins/codecall/skills/codecall/`. The
TypeScript runtime in `src/` is an offline, deterministic test harness for the
session state machine, not the product; see [ARCHITECTURE.md](ARCHITECTURE.md).

Listings: Claude Code's [plugin directory submission form](https://clau.de/plugin-directory-submission);
Codex via `platform.openai.com/plugins`.

## License

[MIT](LICENSE)
