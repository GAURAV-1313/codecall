import { describe, expect, it } from "vitest";
import { evaluateLearningOpportunity, SessionOpportunityDeduper } from "../src/policy/opportunity.js";
import type { ImplementationContext } from "../src/schemas/types.js";

function context(task: string, path = "src/feature.ts", summary = task): ImplementationContext {
  return {
    implementation: { task, changedFiles: [{ path, summary }] },
    evidence: [{ source: "file", path, label: summary }],
    expansionRequests: []
  };
}

describe("automatic learning opportunity policy", () => {
  it.each([
    ["Add JWT authentication middleware to protected routes.", "src/routes.ts"],
    ["Add a cross-service webhook integration between billing and notifications.", "src/billing/webhook.ts"],
    ["Add a public API schema migration for account profiles.", "src/schema/profile.ts"],
    ["Make queue processing concurrency-safe with idempotent retries.", "src/queue/worker.ts"]
  ])("recommends a meaningful implementation: %s", (task, path) => {
    const opportunity = evaluateLearningOpportunity(context(task, path));

    expect(opportunity.recommendation).toBe("recommend");
    expect(opportunity.strongSignals.length).toBeGreaterThan(0);
    expect(opportunity.reasoning.join(" ")).toContain(path);
    expect(Object.keys(opportunity.signals)).not.toContain("line_count");
  });

  it("marks one reusable local pattern optional rather than interrupting", () => {
    const opportunity = evaluateLearningOpportunity(context("Extract an adapter around the existing client.", "src/client-adapter.ts"));

    expect(opportunity.recommendation).toBe("optional");
    expect(opportunity.moderateSignals).toContain("reusable_pattern_or_lifecycle");
  });

  it.each([
    ["Run prettier formatting.", "src/button.ts"],
    ["Update README copy.", "README.md"],
    ["Rename local helper.", "src/helper.ts"],
    ["Dependency bump for a patch release.", "package-lock.json"],
    ["Apply a straightforward local bug fix.", "src/format.ts"]
  ])("skips non-learning work: %s", (task, path) => {
    expect(evaluateLearningOpportunity(context(task, path)).recommendation).toBe("skip");
  });

  it("skips test-only work without a transferable strategy and keeps a strategy optional", () => {
    const isolatedTest = evaluateLearningOpportunity(context("Add a regression assertion.", "test/user.test.ts"));
    const harness = evaluateLearningOpportunity(context("Add an end-to-end test harness for checkout.", "test/checkout.e2e.test.ts"));

    expect(isolatedTest.recommendation).toBe("skip");
    expect(isolatedTest.excludedChangeCategories).toContain("test_only_without_strategy");
    expect(harness.recommendation).toBe("optional");
    expect(harness.moderateSignals).toContain("operational_behavior");
  });

  it("suppresses a concept cluster after it has been evaluated in the same session", () => {
    const deduper = new SessionOpportunityDeduper();
    const first = deduper.evaluate(context("Add JWT authentication middleware.", "src/auth.ts"));
    const repeat = deduper.evaluate(context("Add authentication middleware for admin routes.", "src/admin.ts"));

    expect(first.recommendation).toBe("recommend");
    expect(repeat.recommendation).toBe("skip");
    expect(repeat.excludedChangeCategories).toContain("already_evaluated_in_session");
    expect(repeat.conceptFingerprint).toBe(first.conceptFingerprint);
  });
});
