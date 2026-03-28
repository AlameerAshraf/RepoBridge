import path from "node:path";
import os from "node:os";
import fs from "fs-extra";

const BASE_DIR = path.join(os.homedir(), ".repobridge");

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

// Paths
export function basePath(): string {
  return BASE_DIR;
}

export function projectPath(name: string): string {
  return path.join(BASE_DIR, "projects", name);
}

export function reposClonePath(): string {
  return path.join(BASE_DIR, "repos");
}

// Global config
export async function getGlobalConfig(): Promise<GlobalConfig> {
  const configPath = path.join(BASE_DIR, "config.json");
  if (await fs.pathExists(configPath)) {
    return fs.readJson(configPath);
  }
  return {};
}

export async function setGlobalConfig(config: GlobalConfig): Promise<void> {
  await fs.ensureDir(BASE_DIR);
  await fs.writeJson(path.join(BASE_DIR, "config.json"), config, { spaces: 2 });
}

// Active project
export async function getActiveProject(): Promise<string | undefined> {
  const config = await getGlobalConfig();
  return config.activeProject;
}

export async function setActiveProject(name: string): Promise<void> {
  const config = await getGlobalConfig();
  config.activeProject = name;
  await setGlobalConfig(config);
}

export async function clearActiveProject(): Promise<void> {
  const config = await getGlobalConfig();
  delete config.activeProject;
  await setGlobalConfig(config);
}

export async function requireActiveProject(): Promise<string> {
  const active = await getActiveProject();
  if (!active) {
    throw new Error("No active project. Run `repobridge use <project-name>` first.");
  }
  const configPath = path.join(projectPath(active), "config.json");
  if (!(await fs.pathExists(configPath))) {
    throw new Error(`Project "${active}" not found. Run \`repobridge init ${active}\` first.`);
  }
  return active;
}

// Project CRUD
export async function createProject(name: string): Promise<ProjectConfig> {
  const dir = projectPath(name);
  if (await fs.pathExists(dir)) {
    throw new Error(`Project "${name}" already exists.`);
  }
  await fs.ensureDir(path.join(dir, "index"));
  await fs.ensureDir(path.join(dir, "sessions"));
  await fs.ensureDir(path.join(dir, "plans"));
  await fs.ensureDir(path.join(dir, "debates"));

  const config: ProjectConfig = {
    name,
    repos: [],
    createdAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
  };
  await fs.writeJson(path.join(dir, "config.json"), config, { spaces: 2 });
  await setActiveProject(name);
  return config;
}

export async function deleteProject(name: string): Promise<void> {
  const dir = projectPath(name);
  if (!(await fs.pathExists(dir))) {
    throw new Error(`Project "${name}" not found.`);
  }
  await fs.remove(dir);

  // Clear active project if it was the deleted one
  const config = await getGlobalConfig();
  if (config.activeProject === name) {
    delete config.activeProject;
    await setGlobalConfig(config);
  }
}

export async function getProjectConfig(name: string): Promise<ProjectConfig> {
  const configPath = path.join(projectPath(name), "config.json");
  if (!(await fs.pathExists(configPath))) {
    throw new Error(`Project "${name}" not found.`);
  }
  return fs.readJson(configPath);
}

export async function updateProjectConfig(name: string, config: ProjectConfig): Promise<void> {
  config.lastUsed = new Date().toISOString();
  await fs.writeJson(path.join(projectPath(name), "config.json"), config, { spaces: 2 });
}

export async function listProjects(): Promise<ProjectConfig[]> {
  const projectsDir = path.join(BASE_DIR, "projects");
  if (!(await fs.pathExists(projectsDir))) return [];
  const dirs = await fs.readdir(projectsDir);
  const projects: ProjectConfig[] = [];
  for (const dir of dirs) {
    const configPath = path.join(projectsDir, dir, "config.json");
    if (await fs.pathExists(configPath)) {
      projects.push(await fs.readJson(configPath));
    }
  }
  return projects;
}

// Repos
export async function addRepoToProject(projectName: string, entry: RepoEntry): Promise<void> {
  const config = await getProjectConfig(projectName);
  if (config.repos.some((r) => r.name === entry.name)) {
    throw new Error(`Repo "${entry.name}" already exists in project "${projectName}".`);
  }
  config.repos.push(entry);
  await updateProjectConfig(projectName, config);
}

// Index
export async function saveRepoIndex(projectName: string, index: RepoIndex): Promise<void> {
  const indexPath = path.join(projectPath(projectName), "index", `${index.repo}.json`);
  await fs.writeJson(indexPath, index, { spaces: 2 });
}

export async function getRepoIndex(projectName: string, repoName: string): Promise<RepoIndex | null> {
  const indexPath = path.join(projectPath(projectName), "index", `${repoName}.json`);
  if (!(await fs.pathExists(indexPath))) return null;
  return fs.readJson(indexPath);
}

export async function getAllRepoIndexes(projectName: string): Promise<RepoIndex[]> {
  const config = await getProjectConfig(projectName);
  const indexes: RepoIndex[] = [];
  for (const repo of config.repos) {
    const index = await getRepoIndex(projectName, repo.name);
    if (index) indexes.push(index);
  }
  return indexes;
}

// Sessions
export async function saveSession(projectName: string, session: Session): Promise<void> {
  const sessionsPath = path.join(projectPath(projectName), "sessions", `${session.id}.json`);
  await fs.writeJson(sessionsPath, session, { spaces: 2 });
}

export async function listSessions(projectName: string): Promise<Session[]> {
  const sessionsDir = path.join(projectPath(projectName), "sessions");
  if (!(await fs.pathExists(sessionsDir))) return [];
  const files = await fs.readdir(sessionsDir);
  const sessions: Session[] = [];
  for (const file of files) {
    if (file.endsWith(".json")) {
      sessions.push(await fs.readJson(path.join(sessionsDir, file)));
    }
  }
  return sessions.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export async function getSession(projectName: string, id: string): Promise<Session | null> {
  const sessionPath = path.join(projectPath(projectName), "sessions", `${id}.json`);
  if (!(await fs.pathExists(sessionPath))) return null;
  return fs.readJson(sessionPath);
}

// Plans
export async function savePlan(projectName: string, plan: Plan): Promise<void> {
  const planPath = path.join(projectPath(projectName), "plans", `${plan.id}.json`);
  await fs.writeJson(planPath, plan, { spaces: 2 });
}

export async function listPlans(projectName: string): Promise<Plan[]> {
  const plansDir = path.join(projectPath(projectName), "plans");
  if (!(await fs.pathExists(plansDir))) return [];
  const files = await fs.readdir(plansDir);
  const plans: Plan[] = [];
  for (const file of files) {
    if (file.endsWith(".json")) {
      plans.push(await fs.readJson(path.join(plansDir, file)));
    }
  }
  return plans.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export async function getPlan(projectName: string, id: string): Promise<Plan | null> {
  const planPath = path.join(projectPath(projectName), "plans", `${id}.json`);
  if (!(await fs.pathExists(planPath))) return null;
  return fs.readJson(planPath);
}

// Debates
export async function saveDebate(projectName: string, debate: DebateResult): Promise<void> {
  const debatePath = path.join(projectPath(projectName), "debates", `${debate.id}.json`);
  await fs.writeJson(debatePath, debate, { spaces: 2 });
}
