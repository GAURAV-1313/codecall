# Drill: debugging practice on real code

A drill is a debugging interview round run on the developer's own project.
Plant one bug, hand over only the symptom, coach without solving, then put the
code back exactly as it was. Drills are the only codecall mode that edits
source code, so every rule below about Git and restoring is mandatory.

## Start gate

1. Check Git: `git rev-parse --is-inside-work-tree` must succeed and
   `git status --porcelain` must print nothing outside `codecall/`, where
   earlier receipts live. Otherwise stop and ask the developer to commit or
   stash first; never commit, stash, branch or reset on their behalf. Record
   `git rev-parse HEAD`.
2. Pick the target: the area named in the argument, else the implementation
   from this conversation, else ask for one line. Read progressively, as in
   the Session: the named files first, then focused excerpts. Never scan the
   whole repository.
3. Find how the developer will see the bug: an existing test, a run command,
   a request (`curl`), or a script. Prefer an existing test that covers the
   target. If nothing can show a symptom, pick another site or say so.
4. Show this and wait:

   ```text
   Debugging drill: <area>
   Difficulty: <easy|medium|hard>
   Estimated time: <N> minutes
   I will change one file to plant a bug and restore it with Git at the end.
   If your editor asks you to approve that edit, approve it without reading it.

   Start Drill / Skip
   ```

   On Skip or cancel: stop, and write nothing.

## Plant the bug

1. Choose one realistic bug, the kind people actually ship: an off-by-one, a
   flipped comparison, a missing `await`, an unhandled null or empty case,
   swapped arguments, a wrong status code, a stale or wrong cache key, a
   mutable default, a missing transaction or lock, a wrong state update.
   For server-side code, prefer a misconception from the matching card in
   [backend-map/](backend-map/index.md), so the bug teaches a mapped concept;
   remember its id. When earlier receipts' `codecall-concepts` meta tags show
   a mapped id as missed and the target exercises it, prefer it.
2. Match the difficulty:
   - `easy`: it crashes, and the stack trace points near the bug.
   - `medium`: wrong output, with the bug one call or layer away from where the
     symptom shows.
   - `hard`: wrong only for some inputs or timings, or fails silently; the
     developer has to find the input that shows it.
3. Constraints: one file, at most three changed lines, compiles or parses,
   and looks like plausible code, not like a planted bug. No comment, name or
   formatting change gives it away. Never plant a bug in auth or permission
   checks, secrets, migrations, data deletion, generated files, lockfiles or
   CI config, and never make a change that is unsafe if it runs against a
   shared service.
4. Make the edit, then run the reproduction once yourself to confirm the
   symptom appears. If it does not, restore and pick a different bug.
5. Record the time (`date +%s`). From here, never name the file, function,
   line or kind of bug in chat until the reveal.

## Run the drill

1. Hand over a symptom report, as an interviewer would: what users see, what
   was expected, and the reproduction command. Nothing else.
2. The developer drives. Answer questions the way an interviewer would: say
   what the system does, but never where the bug is. Let them run commands,
   add logs and set breakpoints themselves.
3. Hints only when asked, one at a time, in this order:
   1. The area or layer to look in.
   2. What to log, print or break on, and what to compare.
   3. The function.
   4. The line.
   Count every hint given.
4. The drill ends when the developer names the line and why it causes the
   symptom (found), gives up, or asks to stop (missed). A fix they write is
   welcome but not required; the code is restored either way.

## Reveal and restore

1. Show `git diff`: the planted change and what it should have been.
2. Explain the causal chain from that line to the symptom in two or three
   steps, then the fastest route a strong candidate would take: reproduce,
   read the error in full, narrow down with logs or breakpoints, state a
   hypothesis, confirm it.
3. Restore: `git checkout -- <file>`. Then run `git status --porcelain`.
   Anything still changed outside `codecall/` is the developer's own debugging
   (logs, prints, a fix): list it and ask whether to revert it; revert only on
   a yes. Confirm `git rev-parse HEAD` matches the recorded value; if it moved,
   check `git diff <recorded> HEAD -- <file>` and tell the developer if the
   bug was committed, without rewriting their history.
4. Restore on every way out: found, missed, stop, error, or a new request
   that abandons the drill. If restoring fails, stop and tell the developer
   the exact command to run; never leave a drill bug in silently.

## The drill receipt

Write `./codecall/NNNN-drill-<slug>.html` from
[drill-receipt-template.html](drill-receipt-template.html), numbered like
every other receipt. Print the path and the result line in chat. It holds:

- The area and the date.
- Found or missed, the minutes taken, and the hints used out of 4.
- The kind of bug in a few words, with the file name only; no source code.
- What the developer did well and one habit to work on, both specific to
  how this drill went, and the fastest route in one line.
- For a missed drill whose bug maps to a concept card, one "Go deeper" line
  with that card's links, exactly as written there.
- Meta tags: `codecall-mode` is `drill`, `codecall-drill` is `found` or
  `missed`, `codecall-hints` and `codecall-minutes` are numbers,
  `codecall-concepts` is `id:ok` or `id:no` for the mapped concept, or empty.
  `id:ok` means found with at most two hints.
- When earlier receipts exist, the same streak line as a quiz receipt.

Write the receipt only after the code is restored.
