# Completion learning check

After completing a meaningful implementation and **before** sending the normal
final completion response, evaluate whether the change merits a short learning
session. Use the current task, conversation, and known edited files as the
primary evidence; Git is optional.

Recommend learning only when the implementation materially introduces or
exercises one or more of: a new concept, pattern, dependency, architecture
decision, cross-component behavior, or non-obvious tradeoff. Do not recommend
it solely because many lines or files changed. Usually skip cosmetic edits,
formatting, trivial copy changes, and isolated mechanical fixes.

When the opportunity is worthwhile, end the implementation response with this
non-blocking prompt and wait for the developer's choice:

```text
Implementation completed.
Learning opportunity: <specific implementation reason>
Estimated learning time: <N> minutes

Start Learning / Skip
```

Do not begin teaching until the developer chooses Start Learning. On Start,
follow the `learn` skill. On Skip, finish normally. Never request an API key or
use an external model for this workflow.
