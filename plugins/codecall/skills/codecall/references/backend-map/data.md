# Databases

## schema-design-constraints

- **Name:** Schema design and constraints
- **Requires:** none
- **Signals:** `NOT NULL`, `UNIQUE`, `REFERENCES`, `CHECK (`, `ON DELETE CASCADE`, `unique=True`
- **Idea:** Types and constraints encode rules your data must always obey, so the database rejects bad rows even when a code path forgets to validate.
- **Misconceptions:**
  - App validation makes constraints redundant; scripts, races and other services bypass it, and only the database sees every write.
  - Foreign keys are just slow; they prevent orphaned rows, and their cost is usually an index on the referencing column.
- **Checks:**
  - Which rule in your change lives only in application code, and what bad row could a concurrent request or script insert?
  - What should happen to child rows when the parent is deleted, and does your `ON DELETE` choice match?
- **Go deeper:**
  - [Sriniously · Backend from first principles #12 · 1:01:37](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=3697s)
  - [PostgreSQL docs: Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)

## database-migrations

- **Name:** Database migrations
- **Requires:** `schema-design-constraints`
- **Signals:** `migrations/`, `ALTER TABLE`, `knex migrate`, `alembic upgrade`, `manage.py migrate`, `CREATE INDEX CONCURRENTLY`
- **Idea:** Versioned, ordered scripts change the schema the same way in every environment, and must stay compatible with the code version still running during deploys.
- **Misconceptions:**
  - Migrations are instant; adding a constraint or rewriting a big table can block writes for minutes.
  - Renaming or dropping a column in one step is fine; old instances still query it mid-deploy, so expand first and contract later.
- **Checks:**
  - On a large production table, what locks does your migration take, and which requests wait behind it?
  - If this deploy rolls back after your migration ran, can the previous code still use the new schema?
- **Go deeper:**
  - [Sriniously · Backend from first principles #12 · 53:33](https://www.youtube.com/watch?v=F7Vwp2Xo5Do&t=3213s)
  - [Martin Fowler: Evolutionary Database Design](https://martinfowler.com/articles/evodb.html)

## database-indexes

- **Name:** Database indexes
- **Requires:** `schema-design-constraints`
- **Signals:** `CREATE INDEX`, `EXPLAIN ANALYZE`, `Seq Scan`, `@@index([`, `db_index=True`, composite `(user_id, created_at)`
- **Idea:** An index is a sorted lookup structure that finds matching rows without scanning the table, trading write cost and storage for fast reads.
- **Misconceptions:**
  - More indexes are always better; every insert and update must maintain each one, and unused indexes only cost writes.
  - A composite index helps any query on its columns; it serves filters on its leading columns, so column order matters.
- **Checks:**
  - Does `EXPLAIN` show an index scan for your main query, and which column order serves both its filter and `ORDER BY`?
  - Which new index in your code slows a write-heavy table, and is the read it speeds up worth it?
- **Go deeper:**
  - [Sriniously · Backend from first principles #21.1 · 53:55](https://www.youtube.com/watch?v=z7kt_p44rjs&t=3235s)
  - [PostgreSQL docs: Indexes](https://www.postgresql.org/docs/current/indexes.html)

## n-plus-one-queries

- **Name:** The N+1 query problem
- **Requires:** none
- **Signals:** `await` inside a `for` loop, `select_related(`, `prefetch_related(`, `.includes(`, `DataLoader`
- **Idea:** Loading a list then querying once per item turns one page into N+1 round trips, so fetch related data in a join or one batched query.
- **Misconceptions:**
  - Each query is fast, so it is fine; round-trip latency multiplies with N and grows silently as data grows.
  - The ORM handles it; lazy-loaded relations accessed in templates or serializers are exactly what triggers it.
- **Checks:**
  - If your endpoint returns 100 items, how many queries does your code send, and where does each extra one start?
  - Would a join or one `WHERE id IN (...)` batch suit your code better, given how many related rows each item has?
- **Go deeper:**
  - [Sriniously · Backend from first principles #21.1 · 42:55](https://www.youtube.com/watch?v=z7kt_p44rjs&t=2575s)
  - [Microsoft Learn: Efficient Querying in EF Core](https://learn.microsoft.com/en-us/ef/core/performance/efficient-querying)

## connection-pooling

- **Name:** Connection pooling
- **Requires:** none
- **Signals:** `new Pool(`, `pool.connect()`, `SetMaxOpenConns`, `pool_size=`, `maximumPoolSize`, `PgBouncer`
- **Idea:** Opening a database connection is slow and servers allow few of them, so a pool keeps a bounded set open and lends them to requests.
- **Misconceptions:**
  - A bigger pool means more throughput; past the database's capacity, extra connections add contention, and replicas multiply the total.
  - Connections return themselves; a client not released on an error path leaks until the pool is empty.
- **Checks:**
  - Given your pool size and maximum instance count, how many connections could hit the database at peak, versus its `max_connections`?
  - On the error path in your handler, what guarantees the connection or transaction is released back to the pool?
- **Go deeper:**
  - [Sriniously · Backend from first principles #21.1 · 1:07:20](https://www.youtube.com/watch?v=z7kt_p44rjs&t=4040s)
  - [Go docs: Managing connections](https://go.dev/doc/database/manage-connections)

## transactions-isolation

- **Name:** Transactions and isolation levels
- **Requires:** `schema-design-constraints`
- **Signals:** `BEGIN` / `COMMIT`, `SERIALIZABLE`, `SELECT ... FOR UPDATE`, `@Transactional`, `transaction.atomic`
- **Idea:** A transaction makes statements succeed or fail together, and its isolation level decides which concurrency anomalies, like lost updates, your code can still see.
- **Misconceptions:**
  - A transaction alone prevents races; at the default Read Committed, read-then-write logic still loses updates without row locks or stronger isolation.
  - Serializable needs no code changes; it aborts conflicting transactions with serialization errors your code must retry.
- **Checks:**
  - If two requests run your read-then-update code at the same moment, what isolation level or lock stops one from overwriting the other?
  - Does your transaction stay open across a network call, and how long could it hold locks?
- **Go deeper:**
  - [PostgreSQL docs: Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)

## optimistic-concurrency

- **Name:** Optimistic concurrency and conditional writes
- **Requires:** `transactions-isolation`
- **Signals:** `version` column, `WHERE id = $1 AND version = $2`, `If-Match`, `@Version`, `ConditionExpression`, `rowCount === 0`
- **Idea:** Instead of locking, a write succeeds only if the row still matches the version you read, so concurrent edits are detected rather than silently overwritten.
- **Misconceptions:**
  - The update succeeded because no error was thrown; zero affected rows is the conflict signal, and code must check it.
  - Optimistic always beats locking; under heavy contention most writes fail and retry, so pessimistic locks can be cheaper.
- **Checks:**
  - When your update affects zero rows because the version changed, what does your code return, and is the user's edit lost?
  - How often do two writers touch the same row in your feature, and does that favor version checks or `SELECT ... FOR UPDATE`?
- **Go deeper:**
  - [Sriniously · Backend from first principles #23 · 1:03:09](https://www.youtube.com/watch?v=Ie0TjKI9cDI&t=3789s)
  - [Martin Fowler: Optimistic Offline Lock](https://martinfowler.com/eaaCatalog/optimisticOfflineLock.html)

## read-replicas-sharding

- **Name:** Read replicas and sharding
- **Requires:** `database-indexes`
- **Signals:** `DATABASE_REPLICA_URL`, `readReplicas(`, `using('replica')`, `shard_key`, `tenant_id` routing, `replication lag`
- **Idea:** Replicas copy the primary to spread reads, while sharding splits data across databases by key to spread writes, each adding consistency and routing costs.
- **Misconceptions:**
  - A replica read right after a write returns that write; asynchronous replication lags, so read-your-writes needs the primary.
  - Sharding is the first fix for a slow database; indexes, caching and replicas come first, since cross-shard queries are hard.
- **Checks:**
  - After your code writes a row, which following read could hit a lagging replica, and what would the user see?
  - If your table were sharded by the key your code uses, which query would need to touch every shard?
- **Go deeper:**
  - [Sriniously · Backend from first principles #21.2 · 27:47](https://www.youtube.com/watch?v=sOhAopEwjH4&t=1667s)
  - [Microsoft Learn: Sharding pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/sharding)

## full-text-search

- **Name:** Full-text search and inverted indexes
- **Requires:** `database-indexes`
- **Signals:** `to_tsvector(`, `@@ to_tsquery`, `USING GIN`, `ILIKE '%`, `_search` (Elasticsearch), `pg_trgm`
- **Idea:** An inverted index maps each normalized word to the documents containing it, giving ranked, stemmed search that `LIKE` scans cannot match at scale.
- **Misconceptions:**
  - `ILIKE '%term%'` with a B-tree index is fast; a leading wildcard cannot use it, so every row is scanned.
  - The search engine is the source of truth; it is an eventually consistent copy needing reindexing on change.
- **Checks:**
  - On a million rows, does your search query use an index that supports word matching and ranking?
  - When a record changes, how does your code update the search index, and how stale can results get?
- **Go deeper:**
  - [Sriniously · Backend from first principles #15 · 8:48](https://www.youtube.com/watch?v=7_sovzAhRSM&t=528s)
  - [PostgreSQL docs: Full Text Search Introduction](https://www.postgresql.org/docs/current/textsearch-intro.html)
