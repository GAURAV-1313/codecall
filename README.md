# codecall

**Understand the code your AI agent writes.**

[![npm version](https://img.shields.io/npm/v/codecall.svg)](https://www.npmjs.com/package/codecall)
[![license: MIT](https://img.shields.io/npm/l/codecall.svg)](LICENSE)

codecall is a skill for AI coding agents. After your agent builds something,
it teaches you the ideas behind the change using your own code, checks that
you can explain them, and gives you a one-page receipt. It can also walk you
through a request flow, or plant a bug for you to find.

Works in Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Kiro and Copilot.
No API key, no account, nothing uploaded.

![A codecall receipt: the change in a line, each idea marked could explain or could not, a score of 3 of 4](https://raw.githubusercontent.com/GAURAV-1313/codecall/main/docs/receipt.png)

## Features

| Mode | Command | What you get |
| --- | --- | --- |
| **Learn** | `/codecall` | A 4-minute session on the 2 to 4 ideas behind the change your agent just made, two checks per idea, and a receipt with your score. |
| **Trace** | `/codecall trace POST /login` | One request followed from entry point to response, `file:line` by `file:line`, then a check on the steps most likely to hide a bug. |
| **Drill** | `/codecall drill src/orders medium` | A debugging round on your own project: one planted bug, only the symptom, hints on request, and your code restored with Git afterwards. |
| **Backend concept map** | automatic | About 80 backend concepts that keep server-side lessons consistent and point you to a free video chapter and official docs for anything you missed. |

You are always asked **Start Learning / Skip** before a session begins, and
nothing is taught without your yes.

## Install

Pick one:

| Method | Command | Best for |
| --- | --- | --- |
| Skills CLI | `npx skills add GAURAV-1313/codecall` | Any supported agent |
| npm | `npm install -g codecall` | Claude Code and Codex together |
| Claude Code plugin | `/plugin marketplace add https://github.com/GAURAV-1313/codecall`<br>`/plugin install codecall@codecall` | Getting offered a session automatically after meaningful changes |

The plugin is the only option that offers sessions by itself. It adds a small
local hook that reminds your agent to check whether a change is worth
learning from; it never starts a session without your yes.

For Codex, add the plugin with
`codex plugin marketplace add https://github.com/GAURAV-1313/codecall`, then
`codex plugin add codecall@codecall`.

Restart your agent after installing.

### Which command to type

| Installed via | Command |
| --- | --- |
| Skills CLI or npm | `/codecall` |
| Claude Code plugin | `/codecall:codecall` |
| Codex | `$codecall` |

Add `trace <flow>` or `drill [area] [easy|medium|hard]` after any of them.

## Learn: quiz on what was just built

Say your agent just added login to your app:

```text
You:      /codecall

codecall: Implementation completed.
          Learning opportunity: this adds authentication middleware and a
          new security boundary.
          Estimated learning time: 4 minutes

          Start Learning / Skip

You:      Start Learning

codecall: How confident are you with authentication middleware?
          [ Expert / Comfortable / Heard of it / Never learned ]

You:      Heard of it

codecall: Let's start with why every request now passes through a check
          before reaching your account routes...
          (explains the idea using YOUR code)

          Quick check: if someone sends a request without logging in,
          what should happen?

...

codecall: Receipt: ./codecall/0007-auth-middleware.html
          Could explain 3 of 4.
```

It adapts to your answers. Get one right and the next check is harder. Get one
wrong and it names the gap, explains it again from your code, and asks a fresh
question. It works for any change with a *why* behind it: retry logic, a
database index, a cache layer, a webhook handler.

## Trace: follow one flow

```text
/codecall trace POST /login
```

codecall walks the request from where it enters your code to where it ends,
one `file:line` at a time, then shows the whole path as a single chain. It
finishes by checking you on the 2 or 3 steps where a bug would most likely
hide. It never edits code.

## Drill: debugging practice

```text
/codecall drill src/orders medium
```

Built for debugging interview rounds, run on your own project:

1. codecall plants **one** realistic bug: an off-by-one, a missing `await`, an
   unhandled empty case, a wrong status code.
2. You get only the symptom and how to reproduce it.
3. Ask for a hint when stuck. Hints narrow step by step: where to look, what
   to log, which function, which line.
4. When you find it or give up, codecall shows the planted change, explains
   the fastest route to it, and restores your file with Git.

| Difficulty | What the bug looks like |
| --- | --- |
| `easy` | It crashes near the bug. |
| `medium` | Wrong output, one layer away from the cause. |
| `hard` | Only some inputs fail, or it fails silently. |

Drills need Git and a clean working tree. They only start when you ask; the
automatic offer never proposes one. If your editor asks you to approve the
planted edit, approve it without reading it.

## Backend concept map

For server-side changes, codecall uses a built-in map of about 80 backend
concepts across HTTP, auth, databases, caching, queues, webhooks, real-time,
storage, testing and delivery. It keeps concept names consistent between
sessions, teaches prerequisites first, and draws on known misconceptions. You
never see the map, and changes outside its scope work exactly as before.

When you miss a mapped concept, your receipt adds one **Go deeper** line: the
matching chapter of Sriniously's free
[Backend from first principles](https://www.youtube.com/playlist?list=PLui3EUkuMTPgZcV0QhQrOcwMPcBCcd_Q1)
series, plus an official reference such as MDN, OWASP or the PostgreSQL docs.
A concept you missed before is more likely to come back in a later session.

The map's wording is codecall's own; it links to the videos and does not copy
them. codecall is not affiliated with or endorsed by the series' creator.

## Receipts and scoring

Every session ends with a self-contained HTML file in `./codecall/` in your
project. A Learn receipt shows:

- the change in one line, and the date
- each idea marked ✅ could explain or ❌ could not
- your score, `Could explain N of M`
- three points to remember and the edge cases to check before reusing the
  pattern

An idea counts as *could explain* only when you answer both of its checks
correctly without a reteach. There is no time-on-task score and no claim of
mastery. Earlier receipts add a streak line: sessions this week, your running
explain rate and drills found.

## Privacy

- No API key, account, signup or network call. codecall runs inside the agent
  and conversation you already have open.
- Receipts are the only files it writes, in `./codecall/`. Delete the folder
  to forget every session.
- A drill is the one exception: it changes one file for the length of the
  drill, then restores it with Git. It never commits, stashes or branches.
- The plugin's hook runs locally and only adds a text reminder; it cannot edit
  files or run commands.
- On the Claude Code plugin, planning runs in a read-only helper so it does
  not crowd your main conversation.

## Troubleshooting

**Nothing happens after installing.** Restart your agent or start a new
session; open sessions do not pick up new installs.

**The command isn't found.** Check [which command to type](#which-command-to-type)
for how you installed it.

**The plugin asked me to trust something.** That is the one-time review for
the local hook behind the automatic offer. Decline it and codecall still
works; you just type the command yourself.

**A drill won't start.** Commit or stash your changes first. Drills need a
clean Git working tree so they can restore your code exactly.

## Contributing

```bash
npm install
npm run build
npm test
claude plugin validate ./plugins/codecall
```

The skill lives in `plugins/codecall/skills/codecall/`. The TypeScript in
`src/` is an offline test harness for the session state machine, not the
product; see [ARCHITECTURE.md](ARCHITECTURE.md).

The backend concept map lives in
`plugins/codecall/skills/codecall/references/backend-map/`, one Markdown file
per topic. After editing, run `node scripts/backend-map.mjs` to validate it
and regenerate `index.md`. `npm test` fails on a stale index, a broken
prerequisite, a video timestamp that isn't a real chapter start, or a link
outside the documentation allowlist.

## License

[MIT](LICENSE)
