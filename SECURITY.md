# Security policy

## Supported versions

Only the latest release on npm gets security fixes.

| Version | Supported |
| --- | --- |
| 1.5.x | Yes |
| Older | No. Upgrade with `npm install -g codecall@latest` |

## Reporting a vulnerability

Please report privately, not in a public issue:

1. Open the repository's **Security** tab.
2. Choose **Report a vulnerability** and describe the problem, the affected
   version, and how to reproduce it.

If that option isn't available, open an issue titled "Security contact
request" with no details, and a private channel will be arranged.

You should get a first reply within 7 days. Once a fix is released, the
report is credited in the release notes unless you prefer otherwise.

## What codecall can touch

Useful context for judging impact:

- **No network.** codecall makes no network calls and needs no API key or
  account. It runs inside the agent session you already have open.
- **Receipts.** It writes HTML receipts to `./codecall/` in your project and
  nothing else, except during a drill.
- **Drills.** A drill edits one file to plant a bug, then restores it with
  `git checkout`. It never commits, stashes, branches or pushes, and only
  starts in a clean working tree after you choose Start Drill.
- **Plugin hook.** The Claude Code and Codex plugins add one local Stop hook
  (`plugins/codecall/hooks/`). It reads the session's state and returns a text
  reminder to the agent; it does not edit files or run other commands.

Reports about any of these doing more than described above are in scope, as
are prompt-injection paths that could make the skill act without your
Start Learning or Start Drill choice.
