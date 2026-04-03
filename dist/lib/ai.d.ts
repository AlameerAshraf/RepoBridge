import type { RepoIndex, PlanRepo, DiscussConflict } from "./storage.js";
export declare function askStream(question: string, indexes: RepoIndex[]): AsyncGenerator<string, void, undefined>;
export declare function generatePlan(feature: string, indexes: RepoIndex[]): Promise<{
    repos: PlanRepo[];
    crossCuttingConcerns: string[];
}>;
export declare function analyzeRepo(repoIndex: RepoIndex, feature: string, allIndexes: RepoIndex[]): Promise<string>;
export declare function crossReference(feature: string, repoAnalyses: Array<{
    repo: string;
    analysis: string;
}>, allIndexes: RepoIndex[]): Promise<DiscussConflict[]>;
export declare function deepDive(feature: string, conflicts: DiscussConflict[], repoAnalyses: Array<{
    repo: string;
    analysis: string;
}>, allIndexes: RepoIndex[]): Promise<DiscussConflict[]>;
//# sourceMappingURL=ai.d.ts.map