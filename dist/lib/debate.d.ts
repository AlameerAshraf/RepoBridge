import type { RepoIndex, DebateResult, DebateConflict } from "./storage.js";
export interface DebateCallbacks {
    onRoundStart: (roundNumber: number) => void;
    onMessage: (repoName: string, statement: string, conflicts: DebateConflict[]) => void;
    onRoundEnd: (roundNumber: number) => void;
    onComplete: (result: DebateResult) => void;
}
export declare function runDebate(feature: string, indexes: RepoIndex[], projectName: string, callbacks: DebateCallbacks): Promise<DebateResult>;
//# sourceMappingURL=debate.d.ts.map