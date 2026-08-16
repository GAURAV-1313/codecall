# codecall

[**Website**](https://codecall-theta.vercel.app/) · [npm](https://www.npmjs.com/package/codecall) · [GitHub](https://github.com/GAURAV-1313/codecall)

**codecall teaches you the code you just wrote.**

After you (or your AI coding assistant) finish building something, codecall
turns that work into a quick, friendly quiz — so you actually understand what
was built, not just that it works. It runs inside Codex or Claude Code, the
AI coding tools you already use. No extra app, no signup, no API key.

**Why use it?** It's easy to accept code from an AI assistant without fully
understanding it. codecall closes that gap: right after something is built,
it teaches you the 2–4 key ideas behind it, asks a couple of simple questions
to check your understanding, and tells you what to double check before you
reuse the same pattern elsewhere.

You're always in control — it only starts when you say "yes," and you can
skip it every time if you want.

### What it looks like

Say your AI assistant just added login to your app. You type `$codecall` (or
`/codecall`), and this happens:

```text
You: $codecall

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
          (explains the concept in plain terms, using YOUR actual code)

          Quick check: if someone sends a request without logging in,
          what should happen?
          [ multiple-choice answer ]

You: (pick an answer)

codecall: (tells you if you're right, and why — then moves to the next idea)

...

codecall: Session complete.
          You learned: authentication middleware, token verification.
          Remember: always check the token before touching user data.
          Watch out for: forgetting this check on a new route you add later.
```

That's the whole product — a short, focused conversation about the code that
was just written, grounded in what actually happened, not a generic
tutorial.

### It's not just for auth

Say your assistant instead added retry logic with exponential backoff around
a flaky payment API call. codecall would recommend a session on *why* retries
need backoff and jitter instead of just trying again immediately, teach that
using your actual retry code, then check whether you can spot when retrying
is the wrong call (like after a non-idempotent request that already went
through). Same short format — a couple of ideas, a couple of questions, a
summary — just grounded in whatever you actually built.

## Requirements

- Codex or Claude Code, already installed.
- No account, no signup, no API key, no internet access needed.

## Install it (pick one)

### If you use Codex

```bash
codex plugin marketplace add https://github.com/GAURAV-1313/codecall
codex plugin add codecall@codecall
```

Then restart Codex (or start a new task) and type `$codecall`.

### If you use Claude Code

```text
/plugin marketplace add https://github.com/GAURAV-1313/codecall
/plugin install codecall@codecall
/reload-plugins
```

Then type `/codecall:codecall`.

### Either tool, the simple way (no plugin store)

```bash
npm install -g codecall
```

This installs it for both Codex and Claude Code at once. In Codex, type
`$codecall`. In Claude Code, type `/codecall`.

> **Note:** codecall isn't in the searchable plugin list inside Codex or
> Claude Code yet — you have to install it with the command above, once.
> After that it works normally every time.
>
> **Note:** the plugin install (not the `npm install -g` path) includes a
> small local script that reminds the agent to check whether a session is
> worth offering, so you may see a one-time "this plugin can run code"
> review prompt during setup. It makes no network calls — see
> [Privacy](#privacy--the-short-version).

### How do I know it worked?

Type the command for whichever way you installed it. You should see
something like this:

```text
Implementation completed.
Learning opportunity: <a short reason>
Estimated learning time: <a few minutes>

Start Learning / Skip
```

If you see that, it's working. If nothing happens, try restarting Codex or
Claude Code — a session that was already open won't pick up a fresh install.

## How to use it

1. Finish some work with Codex or Claude Code, like normal.
2. Type the command for your install (`$codecall` or `/codecall`).
3. It asks: **Start Learning or Skip?** Nothing happens until you choose.
4. If you start: it asks how confident you already are, then teaches one idea
   at a time — what it is, why the code needed it, and what breaks without
   it — followed by a quick question to check your understanding.
5. At the end, you get a short summary: what you learned, what to remember,
   and any gotchas to watch for if you reuse the same pattern in another
   project.

A typical session covers 2–4 ideas and takes just a few minutes.

## Want it to offer to teach you automatically?

If you installed the **Codex or Claude Code plugin**, this mostly just
works already: a small local check runs after each turn and reminds the
agent to consider offering codecall when something meaningful just
happened — it never decides *for* you, it just makes sure the agent
actually checks. (Only the plugin install gets this; `npm install -g`
doesn't, since it isn't a plugin.)

Either way, for the strongest guarantee — and the only option for the
`npm install -g` path — copy one small file into your project so the agent's
own instructions always include this check:

- **Codex:** copy [this file](plugins/codecall/skills/codecall/references/AGENTS.codecall.md)
  into your project's `AGENTS.md`.
- **Claude Code:** copy [this file](plugins/codecall/skills/codecall/references/CLAUDE.codecall.md)
  into your project's `CLAUDE.md`.

It's selective on purpose — it only offers after real, meaningful changes
(like a new integration, a security-related change, or an architecture
decision), never for typo fixes, formatting, or routine changes. And it
never teaches without you choosing Start Learning first, automatic or not.

## Privacy — the short version

- No API key, no account, no signup.
- Nothing is uploaded anywhere. It uses the same AI tool and conversation you
  already have open — there's no separate model call.
- It doesn't remember anything between sessions or projects. It only avoids
  repeating the same suggestion twice in one sitting.
- The plugin install's automatic-check script runs entirely on your machine,
  makes no network calls, and only ever adds a text reminder — it can't edit
  files or run other commands on its own.
- On the Claude Code plugin, some of the read-only "figure out if this is
  worth teaching" work runs in an isolated helper (so it doesn't clutter your
  main conversation) — it can only read files, never edit them, and it never
  talks to you directly or teaches anything itself.

## Troubleshooting

**I can't find it when I search inside Codex or Claude Code's plugin list.**
That's expected for now — install it with the command above instead of
searching for it. Once installed, it works like any other plugin.

**Which command do I type?** `$codecall` in Codex. In Claude Code: `/codecall:codecall`
if you installed the plugin, or plain `/codecall` if you used `npm install -g codecall`.

**I installed it, but nothing happens.** Restart Codex/Claude Code, or start a
new task — an already-open session won't see a fresh install.

**Does it ever send my code anywhere?** No — see Privacy above.

**Why did installing the plugin ask me to review/trust something?** That's
the one-time review for the small local script that powers the "offer to
teach automatically" feature above. It's normal, runs locally, and you can
still decline it — codecall still works, you'll just need to type the
command yourself instead of being offered it.

**What's the "helper" mentioned in Privacy — is that someone else reading my
code?** No — it's the same AI tool you're already using, just working in an
isolated scratch space so figuring out what's worth teaching doesn't fill up
your main conversation. You won't see it unless you go looking; it only
hands back a short plan.

## For developers

Want to build, test, or contribute? See [ARCHITECTURE.md](ARCHITECTURE.md)
for the full technical design.

```bash
npm install
npm run build
npm test
```

Validate the plugin before releasing:

```bash
claude plugin validate ./plugins/codecall
```

Want codecall to show up in Codex's or Claude Code's built-in searchable
plugin list (not just install-by-link)? That needs a separate submission to
each company — see
[Getting listed in curated marketplaces](#getting-listed-in-curated-marketplaces).

### Getting listed in curated marketplaces

**Claude Code** — submit via the
[Plugin Directory Submission Form](https://clau.de/plugin-directory-submission).
The plugin `name` becomes permanent once accepted.

**Codex** — submit through `platform.openai.com/plugins`, which requires a
verified OpenAI Platform identity and at least five positive and three
negative test cases. Review is asynchronous with no fixed timeline.

### Advanced: using it as a code library

If you're building your own tool on top of codecall, the core runtime is also
a plain TypeScript library (`import { codecall } from "codecall"`). This is a
deterministic, offline demo/test runtime, not the AI-powered product
experience above. See [ARCHITECTURE.md](ARCHITECTURE.md) for the API.

## License

[MIT](LICENSE)
