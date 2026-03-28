export interface ProjectConfig {
    name: string;
    repos: RepoEntry[];
    createdAt: string;
    lastUsed: string;
}
export interface RepoEntry {
    name: string;
    path: string;
    url?: string;
    addedAt: string;
}
export interface GlobalConfig {
    activeProject?: string;
    provider?: string;
    model?: string;
    apiKey?: string;
    baseUrl?: string;
}
export interface Session {
    id: string;
    project: string;
    question: string;
    answer: string;
    timestamp: string;
    repos: string[];
}
export interface Plan {
    id: string;
    project: string;
    feature: string;
    timestamp: string;
    repos: PlanRepo[];
    crossCuttingConcerns: string[];
    blockers?: DebateConflict[];
}
export interface PlanRepo {
    name: string;
    tasks: PlanTask[];
}
export interface PlanTask {
    file: string;
    action: "create" | "modify" | "delete";
    description: string;
    details?: string[];
    dependencies?: string[];
}
export interface DebateResult {
    id: string;
    project: string;
    feature: string;
    timestamp: string;
    rounds: DebateRound[];
    conflicts: DebateConflict[];
}
export interface DebateRound {
    roundNumber: number;
    messages: DebateMessage[];
}
export interface DebateMessage {
    repo: string;
    statement: string;
    conflicts: DebateConflict[];
}
export interface DebateConflict {
    type: string;
    myRef: string;
    theirRef: string;
    description: string;
    severity?: "high" | "medium" | "low";
}
export interface RepoIndex {
    repo: string;
    indexedAt: string;
    fileTree: string[];
    packageJson?: Record<string, unknown>;
    readme?: string;
    envExample?: string;
    openApiSpec?: string;
    apiRoutes: ApiRoute[];
    exports: ExportEntry[];
    events: string[];
    authPatterns: string[];
}
export interface ApiRoute {
    method: string;
    path: string;
    file: string;
    line?: number;
}
export interface ExportEntry {
    name: string;
    type: "function" | "class" | "const" | "default";
    file: string;
}
export declare function basePath(): string;
export declare function projectPath(name: string): string;
export declare function reposClonePath(): string;
export declare function getGlobalConfig(): Promise<GlobalConfig>;
export declare function setGlobalConfig(config: GlobalConfig): Promise<void>;
export declare function getActiveProject(): Promise<string | undefined>;
export declare function setActiveProject(name: string): Promise<void>;
export declare function clearActiveProject(): Promise<void>;
export declare function requireActiveProject(): Promise<string>;
export declare function createProject(name: string): Promise<ProjectConfig>;
export declare function deleteProject(name: string): Promise<void>;
export declare function getProjectConfig(name: string): Promise<ProjectConfig>;
export declare function updateProjectConfig(name: string, config: ProjectConfig): Promise<void>;
export declare function listProjects(): Promise<ProjectConfig[]>;
export declare function addRepoToProject(projectName: string, entry: RepoEntry): Promise<void>;
export declare function saveRepoIndex(projectName: string, index: RepoIndex): Promise<void>;
export declare function getRepoIndex(projectName: string, repoName: string): Promise<RepoIndex | null>;
export declare function getAllRepoIndexes(projectName: string): Promise<RepoIndex[]>;
export declare function saveSession(projectName: string, session: Session): Promise<void>;
export declare function listSessions(projectName: string): Promise<Session[]>;
export declare function getSession(projectName: string, id: string): Promise<Session | null>;
export declare function savePlan(projectName: string, plan: Plan): Promise<void>;
export declare function listPlans(projectName: string): Promise<Plan[]>;
export declare function getPlan(projectName: string, id: string): Promise<Plan | null>;
export declare function saveDebate(projectName: string, debate: DebateResult): Promise<void>;
//# sourceMappingURL=storage.d.ts.map