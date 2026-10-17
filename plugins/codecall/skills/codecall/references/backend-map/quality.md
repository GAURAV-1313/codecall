# Testing

## test-pyramid

- **Name:** Unit, integration and end-to-end tests
- **Requires:** none
- **Signals:** `describe(`, `pytest`, `func TestX(t *testing.T)`, `@SpringBootTest`, `playwright.config`, `supertest`
- **Idea:** Tests at different scopes trade speed for realism, so most checks live in fast unit tests, fewer in integration tests and a handful in slow end-to-end tests.
- **Misconceptions:**
  - More end-to-end tests always mean more confidence; they are slow, flaky and point vaguely at failures, so suites built mostly from them get ignored.
  - Unit tests alone prove the system works; they miss bugs in SQL, serialization, config and the wiring between components.
- **Checks:**
  - For the change in your code, which bug would a unit test catch that an end-to-end test would not pinpoint, and vice versa?
  - If your test suite took twenty minutes, which tests would you move down a level, and what realism would you give up?
- **Go deeper:**
  - [Sriniously · Backend from first principles #26 · 14:46](https://www.youtube.com/watch?v=HgVrfHX92y4&t=886s)
  - [martinfowler.com: The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)

## test-doubles

- **Name:** Test doubles: stubs, mocks and fakes
- **Requires:** `dependency-injection`
- **Signals:** `jest.mock(`, `vi.fn()`, `unittest.mock.patch`, `@MockBean`, `gomock`, `sinon.stub`
- **Idea:** A test double stands in for a real dependency, with stubs returning canned answers, mocks verifying calls and fakes giving a working lightweight version, so tests stay fast and deterministic.
- **Misconceptions:**
  - Mocking everything makes tests thorough; tests that assert exact internal calls break on every refactor while still passing when the real dependency behaves differently.
  - A mock that returns success proves the integration works; it only proves your code handles the answer you invented.
- **Checks:**
  - In your test, does the double check the outcome your code produces, or just that a specific method was called, and which survives a refactor?
  - What real behaviour of the dependency your code calls, such as timeouts or constraint errors, does your double never simulate?
- **Go deeper:**
  - [Sriniously · Backend from first principles #26 · 27:27](https://www.youtube.com/watch?v=HgVrfHX92y4&t=1647s)
  - [martinfowler.com: Test Double](https://martinfowler.com/bliki/TestDouble.html)

## integration-tests-real-deps

- **Name:** Integration tests against real dependencies
- **Requires:** `test-pyramid`
- **Signals:** `testcontainers`, `PostgreSqlContainer`, `docker-compose.test.yml`, `services: postgres`, `@DataJpaTest`, `pytest-postgresql`
- **Idea:** Integration tests run your code against real instances of the database, cache or broker, usually in throwaway containers, to catch bugs that only appear with the actual engine.
- **Misconceptions:**
  - SQLite or an in-memory fake is close enough to Postgres; types, locking, constraints and SQL dialect differ, so bugs slip through.
  - Integration tests can share one database freely; leftover rows from one test change another's result unless each test isolates or resets data.
- **Checks:**
  - Which behaviour in your code, such as a unique constraint, transaction or JSON column, would pass against a fake but fail against the real database?
  - How does your test suite reset data between tests, and what happens if two tests run in parallel against the same schema?
- **Go deeper:**
  - [Sriniously · Backend from first principles #26 · 41:04](https://www.youtube.com/watch?v=HgVrfHX92y4&t=2464s)
  - [martinfowler.com: Integration Test](https://martinfowler.com/bliki/IntegrationTest.html)

## flaky-tests

- **Name:** Flaky tests: time, network and order
- **Requires:** `test-pyramid`
- **Signals:** `jest.useFakeTimers`, `freezegun`, `setTimeout(` in a test, `Date.now()`, `--randomize`, `retry: 3`
- **Idea:** A flaky test passes or fails without code changes because it depends on wall-clock time, real network, shared state or run order, so its failures stop meaning anything.
- **Misconceptions:**
  - Adding retries or a longer sleep fixes flakiness; it hides a race or hidden dependency and makes the suite slower.
  - A test that passes alone is correct; it may rely on state left by an earlier test and fail when order changes.
- **Checks:**
  - What in your test depends on the current time, a real network call or a fixed sleep, and how would you make it deterministic?
  - If your test fails only in CI under parallel runs, which shared resource in your code would you suspect first?
- **Go deeper:**
  - [Sriniously · Backend from first principles #26 · 1:02:36](https://www.youtube.com/watch?v=HgVrfHX92y4&t=3756s)
  - [martinfowler.com: Eradicating Non-Determinism in Tests](https://martinfowler.com/articles/nonDeterminism.html)

## code-coverage

- **Name:** What code coverage can and cannot tell you
- **Requires:** `test-pyramid`
- **Signals:** `--coverage`, `coverageThreshold`, `pytest-cov`, `go test -cover`, `jacoco`, `istanbul ignore`
- **Idea:** Coverage reports which lines or branches ran during tests, which reveals untested code but says nothing about whether the assertions would catch a wrong result.
- **Misconceptions:**
  - 100% coverage means the code is correct; a test with no meaningful assertions can execute every line.
  - Raising the coverage threshold improves quality; teams then write tests that touch code without checking behaviour, just to hit the number.
- **Checks:**
  - Which branch in your change, such as an error path, is uncovered, and what real failure would it hide?
  - If you broke the main calculation in your code, would any covered test fail, or do the tests only execute it?
- **Go deeper:**
  - [Sriniously · Backend from first principles #26 · 1:07:39](https://www.youtube.com/watch?v=HgVrfHX92y4&t=4059s)
  - [martinfowler.com: Test Coverage](https://martinfowler.com/bliki/TestCoverage.html)
