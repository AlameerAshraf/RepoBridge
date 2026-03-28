import type { RepoIndex, PlanRepo } from "./storage.js";
export declare function askStream(question: string, indexes: RepoIndex[]): AsyncGenerator<string, void, undefined>;
export declare function generatePlan(feature: string, indexes: RepoIndex[]): Promise<{
    repos: PlanRepo[];
    crossCuttingConcerns: string[];
}>;
export declare function debateRound(repoName: string, repoIndex: RepoIndex, feature: string, previousMessages: Array<{
    repo: string;
    statement: string;
    conflicts: Array<{
        type: string;
        my_ref: string;
        their_ref: string;
        description: string;
    }>;
}>, roundNumber: number): Promise<{
    statement: string;
    conflicts: Array<{
        type: string;
        my_ref: string;
        their_ref: string;
        description: string;
    }>;
}>;
//# sourceMappingURL=ai.d.ts.map