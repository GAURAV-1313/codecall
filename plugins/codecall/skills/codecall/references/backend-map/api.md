# API design

## routing-params

- **Name:** Routing, path and query parameters
- **Requires:** `http-messages`
- **Signals:** `/users/:id`, `req.params`, `req.query`, `r.PathValue(`, `@PathVariable`, `Query(`
- **Idea:** A router maps method plus path to a handler; path parameters identify the resource, query parameters refine the request, and both arrive as untrusted strings.
- **Misconceptions:**
  - Route order never matters; many routers match first-registered, so `/users/:id` can swallow `/users/me` if declared first.
  - Path params are already numbers; they are strings, so `"42"` and `42` compare differently until parsed.
- **Checks:**
  - What does your handler do with `/items/abc` when it expects a numeric id, and which status reaches the client?
  - Your endpoint accepts a filter; would it fit better as a path segment or a query parameter, and why?
- **Go deeper:**
  - [Sriniously · Backend from first principles #6 · 4:28](https://www.youtube.com/watch?v=SubuU1iOC2s&t=268s)
  - [MDN: What is a URL?](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_URL)

## api-versioning

- **Name:** API versioning and deprecation
- **Requires:** `routing-params`
- **Signals:** `/api/v1/`, `/v2/`, `Deprecation` header, `Sunset` header, `Accept-Version`
- **Idea:** Versioning lets you ship breaking changes without breaking existing clients, and announced deprecation gives them time to migrate before the old version disappears.
- **Misconceptions:**
  - Adding a field is breaking; additive changes are usually safe, while removing, renaming or retyping fields breaks clients.
  - A new version means copying every handler; most code stays shared, with only the changed edges adapted.
- **Checks:**
  - Does this change to your response shape force a new version, or can existing clients ignore it safely?
  - How would your code tell old-version clients a sunset date, and how would you know who still calls it?
- **Go deeper:**
  - [Sriniously · Backend from first principles #6 · 15:09](https://www.youtube.com/watch?v=SubuU1iOC2s&t=909s)
  - [RFC 9745: The Deprecation HTTP Response Header Field](https://www.rfc-editor.org/rfc/rfc9745)

## serialization-json

- **Name:** Serialization and JSON
- **Requires:** `http-messages`
- **Signals:** `JSON.stringify(`, `json.Marshal(`, `express.json()`, `@JsonProperty`, `model_dump(`, `toJSON`
- **Idea:** Serialization turns in-memory objects into bytes for the wire and back, and the chosen JSON shape becomes a public contract clients depend on.
- **Misconceptions:**
  - Returning the ORM model directly is fine; it leaks internal fields like password hashes and couples clients to your schema.
  - JSON numbers are safe for any integer; JavaScript loses precision above 2^53, so large ids should travel as strings.
- **Checks:**
  - Which fields does your handler serialize, and could a new column added later leak to clients without anyone noticing?
  - How does your code encode dates, money amounts and 64-bit ids, and would a JavaScript client read them exactly?
- **Go deeper:**
  - [Sriniously · Backend from first principles #7 · 8:36](https://www.youtube.com/watch?v=vzg90tY3uM0&t=516s)
  - [RFC 8259: The JSON Data Interchange Format](https://www.rfc-editor.org/rfc/rfc8259)

## input-validation

- **Name:** Input validation and transformation
- **Requires:** `serialization-json`
- **Signals:** `z.object(`, `pydantic.BaseModel`, `@Valid`, `Joi.object(`, `validator.New(`, `class-validator`
- **Idea:** Validation checks untrusted input against an explicit schema at the boundary and transforms it into trusted types, so the rest of the code never handles malformed data.
- **Misconceptions:**
  - Frontend validation is enough; anyone can call the API directly, so the server must validate everything again.
  - Denylisting bad characters is safe; allowlisting expected shapes, types, lengths and ranges is far more reliable.
- **Checks:**
  - If a client sends an extra `role: "admin"` field, does your validation strip it, reject it, or pass it into the database write?
  - Where in your code does a string from the request become a typed value, and what happens on failure?
- **Go deeper:**
  - [Sriniously · Backend from first principles #9 · 15:40](https://www.youtube.com/watch?v=qedj_JjjL-U&t=940s)
  - [OWASP Cheat Sheet: Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

## rest-resource-design

- **Name:** REST resource design
- **Requires:** `routing-params`, `http-methods-idempotency`
- **Signals:** `GET /orders/{id}`, `POST /orders`, `/users/{id}/orders`, `Location` header, `201 Created`
- **Idea:** REST models the API as nouns (resources and collections) acted on by standard HTTP methods, so clients can predict endpoints and behavior without reading custom verbs.
- **Misconceptions:**
  - Verbs in URLs like `/createOrder` are REST; the method carries the verb, the path names the resource.
  - Every database table needs its own endpoint; resources model what clients need, not your storage layout.
- **Checks:**
  - Your code adds an action like "cancel order"; would you model it as a state change on the resource or a sub-resource, and why?
  - How deeply are your routes nested, and would a client need the parent id just to fetch a child it already knows?
- **Go deeper:**
  - [Sriniously · Backend from first principles #11 · 52:10](https://www.youtube.com/watch?v=RG6q57DwV8Y&t=3130s)
  - [Microsoft Learn: Web API design best practices](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design)

## pagination-filtering

- **Name:** Pagination, sorting and filtering
- **Requires:** `rest-resource-design`
- **Signals:** `LIMIT`, `OFFSET`, `?cursor=`, `starting_after`, `next_cursor`, `ORDER BY created_at, id`
- **Idea:** List endpoints return bounded pages with explicit sort and filter rules, so response size and query cost stay predictable as data grows.
- **Misconceptions:**
  - OFFSET pagination scales; the database still reads and discards skipped rows, and concurrent inserts shift pages, so cursors suit large feeds.
  - Sorting by a non-unique column is stable; without a tiebreaker like id, rows can repeat or vanish across pages.
- **Checks:**
  - What stops a client calling your list endpoint with `limit=1000000`, and what would that do to your database?
  - If a row is inserted while a client pages through your results, can it see a duplicate or miss an item?
- **Go deeper:**
  - [Sriniously · Backend from first principles #11 · 1:10:18](https://www.youtube.com/watch?v=RG6q57DwV8Y&t=4218s)
  - [Stripe docs: Pagination](https://docs.stripe.com/api/pagination)

## openapi-contract

- **Name:** OpenAPI as the API contract
- **Requires:** `rest-resource-design`
- **Signals:** `openapi.yaml`, `openapi: 3.1`, `swagger-ui`, `@ApiOperation`, `components/schemas`, `/docs`
- **Idea:** An OpenAPI document describes endpoints, parameters and schemas in a machine-readable file that drives docs, client generation, mocks and contract tests from one source.
- **Misconceptions:**
  - A spec written once stays accurate; unless it is generated from code or checked in CI, it drifts from the real behavior.
  - OpenAPI is only documentation; the same file can validate requests and generate typed clients.
- **Checks:**
  - If your handler changed a field today, what in your setup would catch that the OpenAPI spec no longer matches?
  - Does your spec come from code annotations or is it written first, and what does that choice cost your team?
- **Go deeper:**
  - [Sriniously · Backend from first principles #28 · 16:39](https://www.youtube.com/watch?v=CwKsU84jIWs&t=999s)
  - [OpenAPI Initiative: Getting started](https://learn.openapis.org/)
