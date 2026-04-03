import type { RepoIndex, DiscussResult, DiscussConflict } from "./storage.js";
import { analyzeRepo, crossReference, deepDive } from "./ai.js";

export interface DiscussCallbacks {
  onPhaseStart: (phase: "analysis" | "cross-reference" | "validation", steps: number) => void;
  onRepoAnalyzed: (repoName: string, analysis: string) => void;
  onConflictsFound: (conflicts: DiscussConflict[]) => void;
  onConflictsValidated: (conflicts: DiscussConflict[]) => void;
  onComplete: (result: DiscussResult) => void;
}

export async function runDiscussion(
  feature: string,
  indexes: RepoIndex[],
  projectName: string,
  callbacks: DiscussCallbacks
): Promise<DiscussResult> {
  // Phase 1: Per-repo analysis
  callbacks.onPhaseStart("analysis", indexes.length);
  const analyses: Array<{ repo: string; analysis: string }> = [];
  for (const index of indexes) {
    const analysis = await analyzeRepo(index, feature, indexes);
    analyses.push({ repo: index.repo, analysis });
    callbacks.onRepoAnalyzed(index.repo, analysis);
  }

  // Phase 2: Cross-reference for conflicts
  callbacks.onPhaseStart("cross-reference", 1);
  let conflicts = await crossReference(feature, analyses, indexes);
  callbacks.onConflictsFound(conflicts);

  // Phase 3: Validation pass (only if conflicts found)
  if (conflicts.length > 0) {
    callbacks.onPhaseStart("validation", 1);
    conflicts = await deepDive(feature, conflicts, analyses, indexes);
    callbacks.onConflictsValidated(conflicts);
  }

  const result: DiscussResult = {
    id: crypto.randomUUID(),
    project: projectName,
    feature,
    timestamp: new Date().toISOString(),
    analyses,
    conflicts,
  };

  callbacks.onComplete(result);
  return result;
}
