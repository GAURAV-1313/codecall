# Background work and webhooks

## background-jobs

- **Name:** Background jobs and task queues
- **Requires:** none
- **Signals:** `BullMQ`, `@shared_task`, `perform_later`, `@Async`, `visibilityTimeout`, `dead-letter queue`
- **Idea:** Slow or failure-prone work like emails, image processing or third-party calls is put on a durable queue and run by separate workers, so the request returns quickly and the work survives crashes.
- **Misconceptions:**
  - Firing an unawaited promise or thread from the request handler is a background job; it vanishes on a crash or deploy and nothing retries it.
  - A queued job runs exactly once; brokers redeliver after visibility timeouts or worker crashes, so job handlers must be safe to run twice.
- **Checks:**
  - If the worker dies halfway through this job in your code, what state is left behind and what happens when the job is retried?
  - What does your code do with a job that fails every attempt, and how would anyone find out it is stuck?
- **Go deeper:**
  - [Sriniously · Backend from first principles #14 · 9:17](https://www.youtube.com/watch?v=r-nQsyguU1Y&t=557s)
  - [Microsoft Learn: Best practices for background jobs](https://learn.microsoft.com/en-us/azure/architecture/best-practices/background-jobs)

## idempotency-keys

- **Name:** Idempotency keys and at-least-once delivery
- **Requires:** `http-methods-idempotency`
- **Signals:** `Idempotency-Key`, `ON CONFLICT DO NOTHING`, `processed_events` table, unique index on an event or request id
- **Idea:** When a sender may deliver the same request twice, a key the receiver remembers turns the second delivery into a no-op that returns the first result.
- **Misconceptions:**
  - Checking "have I seen this id?" and then inserting is safe; two concurrent duplicates both pass the check unless a unique constraint decides.
  - Retries are rare enough to ignore; every queue, webhook provider and mobile client on a flaky network retries by design.
- **Checks:**
  - If two copies of the same event reach your handler at the same moment, which line in your code stops the second one from charging twice?
  - How long does your code keep processed keys, and what happens to a duplicate that arrives after they expire?
- **Go deeper:**
  - [Sriniously · Backend from first principles #29 · 27:39](https://www.youtube.com/watch?v=eWM0CVReP04&t=1659s)
  - [Stripe docs: Idempotent requests](https://docs.stripe.com/api/idempotent_requests)

## transactional-outbox

- **Name:** Transactional outbox
- **Requires:** `transactions-isolation`, `background-jobs`
- **Signals:** `outbox_events`, `INSERT INTO outbox`, `FOR UPDATE SKIP LOCKED`, `published_at IS NULL`, `Debezium`
- **Idea:** Save the event to an outbox table inside the same transaction as the data change, and let a relay publish it later, so a commit and its message can never disagree.
- **Misconceptions:**
  - Publishing to the broker right after commit is close enough; a crash between the two loses the event, and publishing before commit announces data that may roll back.
  - The outbox gives exactly-once delivery; the relay can publish a row and crash before marking it sent, so consumers still need deduplication.
- **Checks:**
  - If your process crashes right after the database commit in this code, how does the event still reach the queue?
  - How does your relay stop two instances publishing the same outbox row, and what keeps the outbox table from growing forever?
- **Go deeper:**
  - [Sriniously · Backend from first principles #29 · 38:58](https://www.youtube.com/watch?v=eWM0CVReP04&t=2338s)
  - [microservices.io: Pattern: Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html)

## webhook-receiver

- **Name:** Receiving webhooks
- **Requires:** `idempotency-keys`
- **Signals:** `/webhooks/stripe`, `express.raw(`, `@csrf_exempt`, `switch (event.type)`, `event.id`
- **Idea:** A webhook is an HTTP request another service sends when something changes there, so your endpoint must acknowledge fast and handle events arriving late, twice or out of order.
- **Misconceptions:**
  - Doing all the work inside the webhook request is fine; slow handlers hit the sender's timeout, get marked failed and are redelivered while still running.
  - Events arrive in the order they happened; providers retry independently, so an older update can land after a newer one unless you compare timestamps or refetch state.
- **Checks:**
  - If your handler crashes after updating the database but before returning 200, what happens when the provider redelivers the same event?
  - Which status codes does your endpoint return for unknown event types and for internal errors, and how will the sender react to each?
- **Go deeper:**
  - [Sriniously · Backend from first principles #29 · 9:56](https://www.youtube.com/watch?v=eWM0CVReP04&t=596s)
  - [GitHub Docs: Best practices for using webhooks](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks)

## webhook-signatures

- **Name:** Verifying webhook signatures (HMAC)
- **Requires:** `webhook-receiver`
- **Signals:** `Stripe-Signature`, `X-Hub-Signature-256`, `crypto.timingSafeEqual`, `hmac.compare_digest`, `hmac.Equal`, `constructEvent(`
- **Idea:** The sender signs the raw request body with a shared secret using HMAC, and your endpoint recomputes the signature to prove the request is genuine, unmodified and recent before trusting it.
- **Misconceptions:**
  - Verifying against the parsed JSON works; re-serializing changes bytes and spacing, so the signature must be computed over the exact raw body received.
  - Comparing signatures with `==` is fine; an ordinary string compare can leak timing information, so use a constant-time comparison function.
- **Checks:**
  - Does your handler read the raw body before any JSON middleware parses it, and what happens to verification if that middleware order changes?
  - How does your code reject a correctly signed request that was captured last week and replayed today?
- **Go deeper:**
  - [Sriniously · Backend from first principles #29 · 16:52](https://www.youtube.com/watch?v=eWM0CVReP04&t=1012s)
  - [GitHub Docs: Validating webhook deliveries](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries)
