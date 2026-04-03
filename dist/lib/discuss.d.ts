import type { RepoIndex, DiscussResult, DiscussConflict } from "./storage.js";
export interface DiscussCallbacks {
    onPhaseStart: (phase: "analysis" | "cross-reference" | "validation", steps: number) => void;
    onRepoAnalyzed: (repoName: string, analysis: string) => void;
    onConflictsFound: (conflicts: DiscussConflict[]) => void;
    onConflictsValidated: (conflicts: DiscussConflict[]) => void;
    onComplete: (result: DiscussResult) => void;
}
export declare function runDiscussion(feature: string, indexes: RepoIndex[], projectName: string, callbacks: DiscussCallbacks): Promise<DiscussResult>;
//# sourceMappingURL=discuss.d.ts.map