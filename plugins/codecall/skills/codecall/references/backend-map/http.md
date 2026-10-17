# HTTP

## http-messages

- **Name:** HTTP request and response anatomy
- **Requires:** none
- **Signals:** `req.headers`, `Content-Type`, `res.status(`, `request.body`, `http.ResponseWriter`, `w.Header().Set(`
- **Idea:** Every HTTP exchange is a request (method, path, headers, optional body) answered by a response (status, headers, optional body), and handlers only work when they read and write each part deliberately.
- **Misconceptions:**
  - The body explains itself; servers parse it according to the `Content-Type` header, so a missing or wrong header gives you an empty or garbled body.
  - Header names are case-sensitive; HTTP treats them case-insensitively, and HTTP/2 and HTTP/3 send them lowercased on the wire.
- **Checks:**
  - If a client sends this endpoint form-encoded data instead of JSON, what does your handler receive, and where would you see the mismatch?
  - Which headers does your handler set on the response, and what would a client do differently if one were missing?
- **Go deeper:**
  - [Sriniously · Backend from first principles #5 · 7:29](https://www.youtube.com/watch?v=a3C1DMswClQ&t=449s)
  - [MDN: HTTP messages](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Messages)

## http-methods-idempotency

- **Name:** HTTP methods and idempotency
- **Requires:** `http-messages`
- **Signals:** `app.get(`, `router.post(`, `@PutMapping`, `@app.delete`, `PATCH`, `http.MethodPost`
- **Idea:** The method declares intent: GET reads safely, PUT and DELETE are idempotent so repeating them leaves the same state, and POST and PATCH may not be, which decides what clients and proxies can safely retry.
- **Misconceptions:**
  - Idempotent means the response is identical every time; it means the server state ends the same, so a second DELETE may return 404 and still be idempotent.
  - A GET that changes data is fine if the UI only calls it on click; crawlers, prefetchers and retrying proxies will call it too.
- **Checks:**
  - If a network timeout makes the client resend this request, what does your handler do to the data the second time?
  - Your code updates a record with this method; would a client sending only changed fields expect PUT or PATCH semantics, and which does it actually implement?
- **Go deeper:**
  - [Sriniously · Backend from first principles #5 · 18:03](https://www.youtube.com/watch?v=a3C1DMswClQ&t=1083s)
  - [RFC 9110: HTTP Semantics, Idempotent Methods](https://www.rfc-editor.org/rfc/rfc9110#section-9.2.2)

## http-status-codes

- **Name:** Status codes as a contract
- **Requires:** `http-messages`
- **Signals:** `res.status(404)`, `HttpStatus.CREATED`, `status.HTTP_422_UNPROCESSABLE_ENTITY`, `http.StatusConflict`, `raise HTTPException(`
- **Idea:** The status code is the machine-readable outcome clients, retries, caches and monitoring act on, so choosing between 2xx, 4xx and 5xx correctly matters more than the message text.
- **Misconceptions:**
  - Returning 200 with `{"error": ...}` is harmless; clients, caches and alerting treat it as success and never react to the failure.
  - 401 and 403 are interchangeable; 401 means not authenticated, 403 means authenticated but not allowed.
- **Checks:**
  - When validation fails versus when the database is down, which status does your handler return for each, and would a retrying client behave correctly?
  - If your handler throws an unexpected error, does the client get a 500 with a safe message, or a 200 or a leaked stack trace?
- **Go deeper:**
  - [Sriniously · Backend from first principles #5 · 38:51](https://www.youtube.com/watch?v=a3C1DMswClQ&t=2331s)
  - [MDN: HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status)

## cors

- **Name:** CORS and preflight requests
- **Requires:** `http-messages`
- **Signals:** `Access-Control-Allow-Origin`, `cors()`, `CORSMiddleware`, `@CrossOrigin`, `OPTIONS` preflight
- **Idea:** Browsers block scripts from reading cross-origin responses unless the server opts in with CORS headers, and non-simple requests first send an OPTIONS preflight the server must answer.
- **Misconceptions:**
  - CORS protects your API from attackers; it only restricts browsers, so curl, scripts and other servers call your endpoints regardless.
  - `Access-Control-Allow-Origin: *` works with cookies; browsers reject a wildcard on credentialed requests, so the exact origin must be echoed back.
- **Checks:**
  - Your frontend sends JSON with an `Authorization` header; which preflight response headers must your server return, and what breaks if OPTIONS hits auth middleware first?
  - If your code reflects any request `Origin` while allowing credentials, what could a malicious site do with a logged-in user's browser?
- **Go deeper:**
  - [Sriniously · Backend from first principles #5 · 20:07](https://www.youtube.com/watch?v=a3C1DMswClQ&t=1207s)
  - [MDN: Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)

## http-caching-headers

- **Name:** HTTP caching headers
- **Requires:** `http-messages`
- **Signals:** `Cache-Control`, `ETag`, `If-None-Match`, `304 Not Modified`, `Last-Modified`, `Vary`
- **Idea:** Response headers tell browsers and CDNs whether and how long they may reuse a response, and validators like ETag let them revalidate cheaply instead of downloading it again.
- **Misconceptions:**
  - `no-cache` means never store; it means store but revalidate before each use, while `no-store` forbids storing.
  - Per-user responses can share a CDN cache safely; without `private` or a correct `Vary`, one user's data can be served to another.
- **Checks:**
  - Your endpoint returns user-specific data; which `Cache-Control` value does your code send, and could a shared cache ever serve it to someone else?
  - After you deploy a change to this response, how long might clients keep seeing the old version, and what in your headers decides that?
- **Go deeper:**
  - [Sriniously · Backend from first principles #5 · 55:20](https://www.youtube.com/watch?v=a3C1DMswClQ&t=3320s)
  - [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)

## tls-https

- **Name:** TLS and HTTPS
- **Requires:** `http-messages`
- **Signals:** `Strict-Transport-Security`, `https.createServer(`, `ListenAndServeTLS`, `ssl_certificate`, `X-Forwarded-Proto`, `rejectUnauthorized`
- **Idea:** TLS encrypts and authenticates the connection using certificates, so tokens, cookies and data cannot be read or altered in transit and clients know they reached the real server.
- **Misconceptions:**
  - Turning off certificate verification in a client is fine for internal calls; it removes the authentication and lets anyone in the path impersonate the server.
  - HTTPS at the load balancer means the app sees HTTPS; behind a TLS-terminating proxy the app must trust `X-Forwarded-Proto` to know.
- **Checks:**
  - Your app sits behind a proxy that terminates TLS; how does your code decide to set `Secure` cookies or build https redirect URLs?
  - Does any outbound call in your code disable certificate verification, and what would an attacker on that network path gain?
- **Go deeper:**
  - [Sriniously · Backend from first principles #5 · 1:15:18](https://www.youtube.com/watch?v=a3C1DMswClQ&t=4518s)
  - [OWASP Cheat Sheet: Transport Layer Security](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html)
