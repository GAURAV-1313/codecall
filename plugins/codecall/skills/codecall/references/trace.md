# Trace: follow one flow through the code

A trace walks one concrete path, such as "what happens on `POST /login`" or
"where does this value get set", from its entry point to its end, then checks
that the developer can follow it. It never edits code.

## Start gate

1. Identify the flow from the argument. If it is unclear, ask for one line
   before reading any code.
2. Find the entry point (route, handler, `main`, UI event, CLI command, job)
   and read forward from it, one hop at a time. Read only the files on the
   path; never scan the whole repository.
3. Pick the 2 or 3 hops where a bug would most likely hide: where data is
   transformed, validated, stored, cached, sent across a boundary, or can
   fail. These are the session's ideas. For server-side hops, give each at
   most one [backend map](backend-map/index.md) id, under the same rules as
   the Session.
4. Show the Start Learning / Skip card from the Start gate in SKILL.md, with
   `Learning opportunity: trace <flow> through <N> files`. On Skip or cancel:
   stop, and write nothing.

## Session

1. Walk the path hop by hop: `file:line`, what comes in, what it does, what
   goes out, and how it can fail. Quote only the few lines that matter.
2. End the walk with the path as one arrow chain, for example
   `routes/auth.ts:login → AuthService.verify → users.findByEmail → bcrypt.compare → signJwt`.
3. Check each chosen hop with one question, one at a time: a debugging or
   failure question grounded in the path, such as "if `findByEmail` returns
   nothing, what does the client get, and where is that decided?". Never a
   generic definition.
4. Branch as in the Session: correct moves on; wrong names the gap, reteaches
   it from the path, and asks a new isomorphic question. A hop counts as
   explained when its check was answered correctly without a reteach.

## The receipt

Write it from [receipt-template.html](receipt-template.html) like a quiz
receipt, with `codecall-mode` set to `trace`, the flow as the title, each
chosen hop as a concept, the arrow chain as the first point to remember, and
the score as `Could explain N of M` hops.
