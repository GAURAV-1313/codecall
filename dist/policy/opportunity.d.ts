import type { ImplementationContext, LearningOpportunity } from "../schemas/types.js";
/**
 * Deterministic parity policy for the agent-backed skill. It is deliberately
 * evidence-based and selective; it is not the production authority on a
 * conversation's technical meaning.
 */
export declare function evaluateLearningOpportunity(context: ImplementationContext): LearningOpportunity;
/** Deduplicates concept clusters for the lifetime of one runtime/session only. */
export declare class SessionOpportunityDeduper {
    private readonly evaluatedFingerprints;
    evaluate(context: ImplementationContext): LearningOpportunity;
}
