import path from "node:path";
import { execSync, execFileSync } from "node:child_process";
import fs from "fs-extra";
import fg from "fast-glob";
import type { RepoIndex, ApiRoute, ExportEntry } from "./storage.js";

const MAX_DEPTH = 4;
const IGNORE_DIRS = ["node_modules", ".git", "dist", "build", ".next", "__pycache__", ".venv", "vendor", "coverage"];

export async function indexRepo(repoPath: string, repoName: string): Promise<RepoIndex> {
  const absPath = path.resolve(repoPath);

  if (!(await fs.pathExists(absPath))) {
    throw new Error(`Repo path does not exist: ${absPath}`);
  }

  const fileTree = await getFileTree(absPath);
  const packageJson = await readJsonSafe(path.join(absPath, "package.json"));
  const readme = await readFileSafe(path.join(absPath, "README.md"));
  const envExample = await findAndReadEnvExample(absPath);
  const openApiSpec = await findOpenApiSpec(absPath);
  const apiRoutes = await scanApiRoutes(absPath, fileTree);
  const exports = await scanExports(absPath, fileTree);
  const events = await scanEvents(absPath);
  const authPatterns = await scanAuthPatterns(absPath);

  return {
    repo: repoName,
    indexedAt: new Date().toISOString(),
    fileTree,
    packageJson: packageJson ?? undefined,
    readme: readme ? truncate(readme, 3000) : undefined,
    envExample: envExample ?? undefined,
    openApiSpec: openApiSpec ? truncate(openApiSpec, 5000) : undefined,
    apiRoutes,
    exports,
    events,
    authPatterns,
  };
}

async function getFileTree(repoPath: string): Promise<string[]> {
  const ignorePattern = IGNORE_DIRS.map((d) => `!**/${d}/**`);
  const entries = await fg(["**/*"], {
    cwd: repoPath,
    deep: MAX_DEPTH,
    onlyFiles: false,
    markDirectories: true,
    ignore: IGNORE_DIRS.map((d) => `**/${d}/**`),
  });
  return entries.sort().slice(0, 500);
}

async function readJsonSafe(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    if (await fs.pathExists(filePath)) {
      return await fs.readJson(filePath);
    }
  } catch {}
  return null;
}

async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    if (await fs.pathExists(filePath)) {
      return await fs.readFile(filePath, "utf-8");
    }
  } catch {}
  return null;
}

async function findAndReadEnvExample(repoPath: string): Promise<string | null> {
  const candidates = [".env.example", ".env.sample", ".env.template", "env.example"];
  for (const name of candidates) {
    const content = await readFileSafe(path.join(repoPath, name));
    if (content) return content;
  }
  return null;
}

async function findOpenApiSpec(repoPath: string): Promise<string | null> {
  const candidates = ["openapi.yaml", "openapi.json", "swagger.yaml", "swagger.json", "api.yaml", "api.json"];
  for (const name of candidates) {
    const content = await readFileSafe(path.join(repoPath, name));
    if (content) return content;
  }
  return null;
}

async function scanApiRoutes(repoPath: string, fileTree: string[]): Promise<ApiRoute[]> {
  const routes: ApiRoute[] = [];
  const sourceFiles = fileTree.filter((f) =>
    /\.(ts|js|py|go|rb)$/.test(f) &&
    (f.includes("route") || f.includes("controller") || f.includes("endpoint") || f.includes("api") || f.includes("handler"))
  );

  for (const file of sourceFiles.slice(0, 30)) {
    const content = await readFileSafe(path.join(repoPath, file));
    if (!content) continue;

    // Express/Fastify patterns
    const expressPatterns = /\.(get|post|put|patch|delete|all)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
    let match: RegExpExecArray | null;
    while ((match = expressPatterns.exec(content)) !== null) {
      routes.push({ method: match[1]!.toUpperCase(), path: match[2]!, file });
    }

    // FastAPI/Flask patterns
    const pythonPatterns = /@(?:app|router|blueprint)\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
    while ((match = pythonPatterns.exec(content)) !== null) {
      routes.push({ method: match[1]!.toUpperCase(), path: match[2]!, file });
    }
  }

  return routes;
}

async function scanExports(repoPath: string, fileTree: string[]): Promise<ExportEntry[]> {
  const exports: ExportEntry[] = [];
  const indexFiles = fileTree.filter((f) =>
    /(?:index|main|mod)\.(ts|js)$/.test(f) || /src\/[^/]+\.(ts|js)$/.test(f)
  );

  for (const file of indexFiles.slice(0, 30)) {
    const content = await readFileSafe(path.join(repoPath, file));
    if (!content) continue;

    // export function/class/const
    const exportPattern = /export\s+(?:default\s+)?(function|class|const|let|var)\s+(\w+)/g;
    let match: RegExpExecArray | null;
    while ((match = exportPattern.exec(content)) !== null) {
      const kind = match[1]!;
      const name = match[2]!;
      let type: ExportEntry["type"] = "const";
      if (kind === "function") type = "function";
      else if (kind === "class") type = "class";
      exports.push({ name, type, file });
    }

    // export default
    if (/export\s+default\s/.test(content) && !exports.some((e) => e.file === file && e.type === "default")) {
      exports.push({ name: path.basename(file, path.extname(file)), type: "default", file });
    }
  }

  return exports;
}

function safeGrep(args: string[], repoPath: string): string {
  try {
    return execFileSync("grep", [...args, repoPath], {
      encoding: "utf-8",
      maxBuffer: 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (err: unknown) {
    // grep exits 1 when no matches — that's fine
    if (err && typeof err === "object" && "stdout" in err) {
      return (err as { stdout: string }).stdout || "";
    }
    return "";
  }
}

async function scanEvents(repoPath: string): Promise<string[]> {
  const events: string[] = [];

  const result = safeGrep(
    ["-roh", "--include=*.ts", "--include=*.js", "--include=*.py",
     "-E", "(emit|publish|subscribe|on)\\([\"'][a-zA-Z0-9_.:-]+[\"']\\)"],
    repoPath
  );
  const eventPattern = /(?:emit|publish|subscribe|on)\(['"]([a-zA-Z0-9_.:-]+)['"]\)/g;
  let match: RegExpExecArray | null;
  while ((match = eventPattern.exec(result)) !== null) {
    if (!events.includes(match[1]!)) events.push(match[1]!);
  }

  const result2 = safeGrep(
    ["-roh", "--include=*.ts", "--include=*.js", "--include=*.py",
     "-E", "(queue|topic|channel|exchange).*[\"'][a-zA-Z0-9_.:-]+[\"']"],
    repoPath
  );
  const queuePattern = /['"]([a-zA-Z0-9_.:-]+)['"]/g;
  while ((match = queuePattern.exec(result2)) !== null) {
    const val = match[1]!;
    if (val.length > 3 && !events.includes(val)) events.push(val);
  }

  return events.slice(0, 50);
}

async function scanAuthPatterns(repoPath: string): Promise<string[]> {
  const patterns: string[] = [];
  const result = safeGrep(
    ["-rl", "--include=*.ts", "--include=*.js", "--include=*.py",
     "-E", "(middleware|auth|jwt|oauth|bearer|passport|guard)"],
    repoPath
  );
  for (const line of result.trim().split("\n")) {
    if (line) {
      const rel = path.relative(repoPath, line);
      if (!IGNORE_DIRS.some((d) => rel.includes(d))) {
        patterns.push(rel);
      }
    }
  }
  return patterns.slice(0, 20);
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "\n... [truncated]";
}
