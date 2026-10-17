# Configuration and delivery

## config-management

- **Name:** Configuration from the environment
- **Requires:** none
- **Signals:** `process.env`, `os.environ`, `os.Getenv(`, `BaseSettings`, `dotenv`, `@ConfigurationProperties`
- **Idea:** Values that differ between deploys, like database URLs, ports and feature flags, are read from the environment at startup, so one build runs unchanged in dev, staging and production.
- **Misconceptions:**
  - Reading `process.env.X` wherever it is needed is fine; parse and validate once at startup so a missing value fails the boot, not a request later.
  - Config and code constants are the same; values that never change between deploys belong in code, not an ever-growing list of variables.
- **Checks:**
  - If a required variable is missing in production, does your code fail at startup or on the first request that needs it?
  - Which value hardcoded in your code would have to change between staging and production, and how would you move it to config?
- **Go deeper:**
  - [Sriniously · Backend from first principles #17 · 26:41](https://www.youtube.com/watch?v=GR9NtirPXyc&t=1601s)
  - [The Twelve-Factor App: Config](https://12factor.net/config)

## secrets-management

- **Name:** Secrets management
- **Requires:** `config-management`
- **Signals:** `.env.example`, `aws secretsmanager`, `vault kv get`, `secretKeyRef`, `${{ secrets.`, `SecretStr`
- **Idea:** Credentials are kept out of code and images, injected at runtime from a secret store with access control, auditing and rotation, so a leaked repo or log does not leak them.
- **Misconceptions:**
  - Deleting a committed secret in a later commit fixes the leak; it stays in history and forks, so it must be rotated.
  - Environment variables are secure storage; they leak through crash dumps, debug endpoints, child processes and logs that print the config.
- **Checks:**
  - If the API key in your code leaked today, how would you rotate it, and would your service need a redeploy to pick it up?
  - Where could your code accidentally print a secret, such as an error message, request log or config dump, and how would you redact it?
- **Go deeper:**
  - [Sriniously · Backend from first principles #17 · 31:03](https://www.youtube.com/watch?v=GR9NtirPXyc&t=1863s)
  - [OWASP Cheat Sheet: Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

## disposable-processes

- **Name:** Disposable, stateless processes (12-factor)
- **Requires:** `stateless-services`, `graceful-shutdown`
- **Signals:** `SIGTERM`, `terminationGracePeriodSeconds`, `process.on("SIGTERM"`, `signal.NotifyContext`, `replicas:`, `readinessProbe`
- **Idea:** Each process starts fast, keeps no state it cannot lose and shuts down cleanly on a signal, so the platform can kill, restart or scale it at any moment safely.
- **Misconceptions:**
  - A process only stops on deploys; autoscalers, node drains and crashes kill it anytime, so in-memory sessions and queues get lost.
  - Shutting down means exiting immediately; in-flight requests and jobs should finish or be handed back before the process exits.
- **Checks:**
  - If the platform sends your process SIGTERM mid-request, what happens to that request and to any job your code is running?
  - What state does your code keep in memory or on local disk that would vanish if this instance were replaced right now?
- **Go deeper:**
  - [Sriniously · Backend from first principles #27 · 50:16](https://www.youtube.com/watch?v=2_fcv3-XfN4&t=3016s)
  - [The Twelve-Factor App: Disposability](https://12factor.net/disposability)

## ci-pipeline

- **Name:** Continuous integration pipelines
- **Requires:** none
- **Signals:** `.github/workflows/`, `.gitlab-ci.yml`, `on: pull_request`, `actions/cache`, `Jenkinsfile`, `npm ci`
- **Idea:** Every push is built and tested automatically in a clean environment, so integration problems surface within minutes on the change that caused them instead of at release time.
- **Misconceptions:**
  - Passing locally means CI will pass; CI starts clean, so missing lockfile entries, env vars and machine-specific state show up there.
  - A red build can wait; once main stays broken, every later failure hides behind it and people stop trusting the pipeline.
- **Checks:**
  - Which checks run on your change before merge, and which bug class in your code would still reach main untested?
  - If your pipeline takes 25 minutes, which steps would you cache, parallelize or move later, and what feedback would that delay?
- **Go deeper:**
  - [Sriniously · Backend from first principles #30 · 15:50](https://www.youtube.com/watch?v=_E8X5RIJfQ4&t=950s)
  - [martinfowler.com: Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html)

## container-images

- **Name:** Containers and image layers
- **Requires:** none
- **Signals:** `Dockerfile`, `FROM node:22-alpine AS build`, `COPY package*.json ./`, `.dockerignore`, `USER node`, `docker build`
- **Idea:** An image is a stack of cached, read-only layers built from Dockerfile steps, so ordering steps from least to most often changed keeps rebuilds fast and images small.
- **Misconceptions:**
  - Deleting a file in a later layer removes it from the image; it still ships in the earlier layer, including any secret copied in.
  - Copying the whole project before installing dependencies is harmless; any source change invalidates the cache and reinstalls everything.
- **Checks:**
  - In your Dockerfile, which line invalidates the cache on every code change, and how would reordering steps speed up rebuilds?
  - What ends up in your final image that production does not need, such as compilers, tests or `.git`, and how would a multi-stage build drop it?
- **Go deeper:**
  - [Sriniously · Backend from first principles #30 · 38:18](https://www.youtube.com/watch?v=_E8X5RIJfQ4&t=2298s)
  - [Docker docs: Understanding the image layers](https://docs.docker.com/get-started/docker-concepts/building-images/understanding-image-layers/)

## deployment-strategies

- **Name:** Rolling, blue-green and canary deploys
- **Requires:** `load-balancing`
- **Signals:** `strategy: RollingUpdate`, `maxUnavailable`, `maxSurge`, `canary`, `blue-green`, `trafficRouting`
- **Idea:** Rolling, blue-green and canary deploys shift traffic to a new version gradually or switchably, so a bad release reaches few users and can be rolled back without downtime.
- **Misconceptions:**
  - Blue-green makes rollback free; if the new version already migrated the schema or wrote new data, switching back can break the old version.
  - During a rolling deploy only one version runs; old and new serve traffic together, so APIs and schema must work with both.
- **Checks:**
  - While your deploy is half rolled out, which requests could hit the old version after the new one wrote data, and would that break?
  - What metric would tell you a canary of your change is bad, and how quickly could your setup roll it back?
- **Go deeper:**
  - [Sriniously · Backend from first principles #30 · 1:16:26](https://www.youtube.com/watch?v=_E8X5RIJfQ4&t=4586s)
  - [Google SRE Workbook: Canarying Releases](https://sre.google/workbook/canarying-releases/)

## infrastructure-as-code

- **Name:** Infrastructure as code
- **Requires:** none
- **Signals:** `resource "aws_`, `terraform plan`, `.tfstate`, `pulumi up`, `AWSTemplateFormatVersion`, `cdk deploy`
- **Idea:** Servers, networks, databases and permissions are declared in versioned files that a tool applies, so environments are reproducible, reviewed like code and not hand-configured in a console.
- **Misconceptions:**
  - Once infrastructure is in code, console tweaks are harmless; manual changes create drift that the next apply silently reverts or fights.
  - The state file is a disposable artifact; losing or corrupting it makes the tool forget what it owns, and it often holds secrets.
- **Checks:**
  - Before your change applies, what in the plan output would warn you that a resource will be destroyed and recreated instead of updated?
  - Where does your project keep its state file, who can read it, and what stops two people applying at once?
- **Go deeper:**
  - [Sriniously · Backend from first principles #30 · 1:25:18](https://www.youtube.com/watch?v=_E8X5RIJfQ4&t=5118s)
  - [martinfowler.com: Infrastructure As Code](https://martinfowler.com/bliki/InfrastructureAsCode.html)

## slos-incidents

- **Name:** SLOs, error budgets and incidents
- **Requires:** `metrics-monitoring`
- **Signals:** `slo:`, `error_budget`, `histogram_quantile(`, `burn rate`, `availability: 99.9`, `postmortem`
- **Idea:** An SLO sets a target for a user-visible indicator like success rate or latency, and the error budget left over decides when to ship faster or stop and fix reliability.
- **Misconceptions:**
  - The goal is 100% reliability; it is unattainable and costly, and users cannot tell 99.99% from 100% behind their own networks.
  - Alert on every CPU spike or error; page on symptoms that burn the error budget, not causes users never notice.
- **Checks:**
  - Which user-facing indicator would you measure for the endpoint in your code, and what latency or success threshold would count as good?
  - If your change caused errors for 5% of requests for ten minutes, how much of a 99.9% monthly budget would that burn?
- **Go deeper:**
  - [Sriniously · Backend from first principles #30 · 1:33:01](https://www.youtube.com/watch?v=_E8X5RIJfQ4&t=5581s)
  - [Google SRE Book: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
