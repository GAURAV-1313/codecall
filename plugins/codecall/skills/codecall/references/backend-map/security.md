# Security

## sql-injection

- **Name:** SQL injection and parameterized queries
- **Requires:** none
- **Signals:** `WHERE id = $1`, `cursor.execute(sql, params)`, `PreparedStatement`, `$queryRawUnsafe`, `f"SELECT`, `ORDER BY ${`
- **Idea:** When user input is concatenated into SQL text the database parses it as code, so values must travel separately as bound parameters that can never change the query's structure.
- **Misconceptions:**
  - Using an ORM makes you immune; raw-query escape hatches, string-built `where` clauses and dynamic sort columns still inject.
  - Escaping quotes or validating input is enough; identifiers like column names cannot be bound, so they need an allowlist instead.
- **Checks:**
  - Which value in your query reaches the SQL string by concatenation or interpolation rather than as a bound parameter, and where does it come from?
  - If your handler lets the client choose a sort column or filter field, how does your code stop that name from becoming arbitrary SQL?
- **Go deeper:**
  - [Sriniously · Backend from first principles #20 · 29:27](https://www.youtube.com/watch?v=xB1C1xZZW4k&t=1767s)
  - [OWASP Cheat Sheet: SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)

## object-level-authorization

- **Name:** Object-level authorization (BOLA)
- **Requires:** `rbac-authorization`
- **Signals:** `req.params.id`, `findById(id)` without an owner filter, `WHERE id = $1 AND owner_id = $2`, `get_object_or_404(`, `@PreAuthorize`, `/users/:userId/`
- **Idea:** Being logged in and holding the right role says nothing about this particular record, so every lookup by client-supplied id must also check that the caller may access that object.
- **Misconceptions:**
  - Unguessable UUIDs protect records; ids leak through URLs, logs and shared links, so obscurity is not an access check.
  - A role check in middleware covers it; roles say what kind of action is allowed, not whose order or invoice it is.
- **Checks:**
  - If another logged-in user changes the id in this request to yours, which line in your handler returns 404 or 403 instead of your data?
  - Does your code scope the database query itself to the caller's tenant or owner, or fetch first and compare afterwards, and which is easier to forget?
- **Go deeper:**
  - [Sriniously · Backend from first principles #20 · 1:37:31](https://www.youtube.com/watch?v=xB1C1xZZW4k&t=5851s)
  - [OWASP Cheat Sheet: Insecure Direct Object Reference Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html)

## rate-limiting

- **Name:** Rate limiting
- **Requires:** `http-status-codes`
- **Signals:** `429 Too Many Requests`, `Retry-After`, `express-rate-limit`, `golang.org/x/time/rate`, Redis `INCR` with `EXPIRE`
- **Idea:** Capping how many requests a client, key or tenant may make per time window protects shared capacity and slows abuse such as credential stuffing, scraping and runaway retry loops.
- **Misconceptions:**
  - An in-memory counter works in production; with several replicas each instance counts separately, so the real limit becomes the limit times the instance count.
  - Keying limits only by IP is fair; NAT and proxies share IPs, while attackers rotate them, so key by user, API key or account too.
- **Checks:**
  - Where does your limiter store its counters, and what limit does a client actually get when your service runs on three instances behind a load balancer?
  - When your code rejects a request with 429, what does the client learn about when to retry, and how would a well-behaved SDK back off?
- **Go deeper:**
  - [Sriniously · Backend from first principles #20 · 1:32:41](https://www.youtube.com/watch?v=xB1C1xZZW4k&t=5561s)
  - [Microsoft Learn: Throttling pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/throttling)

## xss

- **Name:** Cross-site scripting (XSS)
- **Requires:** none
- **Signals:** `innerHTML`, `dangerouslySetInnerHTML`, `v-html`, `mark_safe(`, `Content-Security-Policy`, `DOMPurify.sanitize(`
- **Idea:** When untrusted data is written into a page without encoding for its context, the browser runs it as script with the victim's session, so output must be escaped or sanitized where it lands.
- **Misconceptions:**
  - Sanitizing input once on the way in is enough; the safe encoding depends on output context, such as HTML body, attribute, URL or inline script.
  - A JSON API cannot cause XSS; a wrong `Content-Type`, or a frontend inserting the response as HTML, turns stored data into script.
- **Checks:**
  - Which user-controlled field in your change ends up rendered as HTML, and what escapes or sanitizes it right before it reaches the page?
  - If an attacker stored `<img src=x onerror=...>` in this field, where would your code render it, and would your CSP block it?
- **Go deeper:**
  - [Sriniously · Backend from first principles #20 · 2:17:21](https://www.youtube.com/watch?v=xB1C1xZZW4k&t=8241s)
  - [OWASP Cheat Sheet: Cross Site Scripting Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

## csrf

- **Name:** Cross-site request forgery (CSRF)
- **Requires:** `cookie-security`
- **Signals:** `SameSite=Lax`, `X-CSRF-Token`, `@csrf_exempt`, `csrf().disable()`, `Sec-Fetch-Site`, `protect_from_forgery`
- **Idea:** Browsers attach cookies to requests that other sites trigger, so a cookie-authenticated endpoint that changes state needs proof the request came from your own pages, not merely the user's browser.
- **Misconceptions:**
  - CORS stops CSRF; CORS only controls reading responses, while a simple cross-site form POST is still sent with cookies.
  - `SameSite` cookies end the problem; `Lax` still permits top-level GET navigations, so state-changing GET routes stay exploitable.
- **Checks:**
  - Which state-changing routes in your code rely on a session cookie, and what token, header or origin check rejects the same request sent from another site?
  - If your code disables CSRF protection for an API route, what guarantees callers authenticate with a header token rather than the browser's cookie?
- **Go deeper:**
  - [Sriniously · Backend from first principles #20 · 2:28:32](https://www.youtube.com/watch?v=xB1C1xZZW4k&t=8912s)
  - [OWASP Cheat Sheet: Cross-Site Request Forgery Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

## ssrf

- **Name:** Server-side request forgery (SSRF)
- **Requires:** none
- **Signals:** `fetch(req.body.url)`, `requests.get(url)`, `http.Get(userURL)`, `169.254.169.254`, `redirect: "manual"`
- **Idea:** When your server fetches a URL the user supplied, an attacker can aim it at internal services or cloud metadata your network trusts, so outbound targets must be restricted.
- **Misconceptions:**
  - Blocking `localhost` in the string is enough; decimal IPs, IPv6, DNS names resolving to private ranges and redirects all bypass string checks.
  - Validating the hostname once is safe; DNS can resolve differently at fetch time, so check the resolved IP on every connection and redirect.
- **Checks:**
  - Which URL in your handler comes from the client, and what stops your code from fetching `http://169.254.169.254/` or a private 10.x address with it?
  - Does your HTTP client follow redirects here, and does your code re-check the destination after each hop?
- **Go deeper:**
  - [Sriniously · Backend from first principles #29 · 25:16](https://www.youtube.com/watch?v=eWM0CVReP04&t=1516s)
  - [OWASP Cheat Sheet: Server Side Request Forgery Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
