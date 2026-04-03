import type { RepoIndex, PlanRepo, DiscussConflict } from "./storage.js";
import { getGlobalConfig } from "./storage.js";
import {
  createProvider,
  DEFAULT_MODELS,
  type LLMProvider,
  type ProviderConfig,
  type ProviderName,
} from "./providers/index.js";

async function getProvider(): Promise<LLMProvider> {
  const globalConfig = await getGlobalConfig();
  const providerName = (globalConfig.provider || "anthropic") as ProviderName;
  const config: ProviderConfig = {
    provider: providerName,
    model: globalConfig.model || DEFAULT_MODELS[providerName] || "claude-sonnet-4-20250514",
    apiKey: globalConfig.apiKey,
    baseUrl: globalConfig.baseUrl,
  };
  return createProvider(config);
}

function buildRepoContext(indexes: RepoIndex[]): string {
  return indexes
    .map((idx) => {
      let ctx = `## Repository: ${idx.repo}\n`;
      ctx += `Indexed at: ${idx.indexedAt}\n\n`;

      if (idx.packageJson) {
        const pkg = idx.packageJson as Record<string, unknown>;
        ctx += `### package.json\n`;
        ctx += `Name: ${pkg.name || "N/A"}\n`;
        ctx += `Description: ${pkg.description || "N/A"}\n`;
        if (pkg.dependencies) {
          ctx += `Dependencies: ${Object.keys(pkg.dependencies as Record<string, unknown>).join(", ")}\n`;
        }
        ctx += "\n";
      }

      if (idx.readme) {
        ctx += `### README (excerpt)\n${idx.readme}\n\n`;
      }

      if (idx.apiRoutes.length > 0) {
        ctx += `### API Routes\n`;
        for (const route of idx.apiRoutes) {
          ctx += `- ${route.method} ${route.path} (${route.file})\n`;
        }
        ctx += "\n";
      }

      if (idx.exports.length > 0) {
        ctx += `### Key Exports\n`;
        for (const exp of idx.exports.slice(0, 30)) {
          ctx += `- ${exp.type} ${exp.name} (${exp.file})\n`;
        }
        ctx += "\n";
      }

      if (idx.events.length > 0) {
        ctx += `### Events/Queues\n${idx.events.join(", ")}\n\n`;
      }

      if (idx.authPatterns.length > 0) {
        ctx += `### Auth-related files\n${idx.authPatterns.join(", ")}\n\n`;
      }

      if (idx.envExample) {
        ctx += `### Environment Variables\n${idx.envExample}\n\n`;
      }

      ctx += `### File Tree (first 100)\n`;
      ctx += idx.fileTree.slice(0, 100).join("\n") + "\n\n";

      return ctx;
    })
    .join("\n---\n\n");
}

export async function* askStream(
  question: string,
  indexes: RepoIndex[]
): AsyncGenerator<string, void, undefined> {
  const provider = await getProvider();
  const repoContext = buildRepoContext(indexes);

  const stream = provider.chatStream([
    {
      role: "system",
      content: `You are RepoBridge, a cross-repo intelligence assistant. You have knowledge of these repositories:\n\n${repoContext}\n\nRules:\n- Be concise and direct. Answer the question, not everything you know about the topic.\n- Lead with the core answer in 1-3 sentences, then add brief supporting details only if needed.\n- Cite sources using [repo-name:file-path] format, but only for key references — don't cite every file.\n- Skip boilerplate, summaries, ASCII diagrams, and "Communication Flow Example" sections.\n- If uncertain, say so briefly.\n- Match your response length to the question's complexity: simple question = short answer.`,
    },
    { role: "user", content: question },
  ]);

  for await (const chunk of stream) {
    yield chunk;
  }
}

export async function generatePlan(
  feature: string,
  indexes: RepoIndex[]
): Promise<{ repos: PlanRepo[]; crossCuttingConcerns: string[] }> {
  const provider = await getProvider();
  const repoContext = buildRepoContext(indexes);

  const text = await provider.chat([
    {
      role: "system",
      content: `You are RepoBridge, a senior software architect planning cross-repo features. You have deep knowledge of these repositories:\n\n${repoContext}\n\nYou produce implementation plans that a developer can follow step by step. You understand existing patterns in each repo and extend them consistently. You think about:\n- Database schemas, migrations, models\n- API endpoints with methods, paths, request/response shapes\n- Service layer business logic\n- Frontend components, state management, API integration\n- Auth/permissions required\n- Shared types/contracts between repos\n- Error handling, validation, edge cases\n- Testing strategy`,
    },
    {
      role: "user",
      content: `Generate a detailed implementation plan for:\n\n"${feature}"\n\nRespond with ONLY valid JSON:\n{\n  "repos": [\n    {\n      "name": "repo-name",\n      "tasks": [\n        {\n          "file": "exact/path/to/file.ts",\n          "action": "create|modify|delete",\n          "description": "One-line summary of what this file does",\n          "details": [\n            "Specific implementation detail 1 (e.g. 'Add Report model with fields: id, name, filters (JSON), chartType, schedule, createdBy')",\n            "Specific implementation detail 2 (e.g. 'GET /api/reports — list reports for authenticated user with pagination')",\n            "Specific implementation detail 3 (e.g. 'Validate filters schema against allowed dimensions and metrics')" \n          ],\n          "dependencies": ["other/file/this/depends/on.ts"]\n        }\n      ]\n    }\n  ],\n  "crossCuttingConcerns": [\n    "Specific concern with actionable detail (e.g. 'Frontend and backend must agree on filter schema shape — define shared FilterConfig type')",\n    "Another concern (e.g. 'PDF export requires a rendering service — evaluate puppeteer vs react-pdf')" \n  ]\n}\n\nRules:\n- Use REAL file paths based on the existing repo structure. Match existing naming conventions.\n- Each task must have 2-5 specific details — not vague descriptions.\n- Details should mention specific function names, field names, endpoint paths, component props.\n- Include database migrations, API routes, services, controllers, components, tests.\n- List dependencies between files so execution order is clear.\n- Cross-cutting concerns must be actionable, not generic.`,
    },
  ], 8192);

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse plan from AI response");
  }
  return JSON.parse(jsonMatch[0]);
}

export async function analyzeRepo(
  repoIndex: RepoIndex,
  feature: string,
  allIndexes: RepoIndex[]
): Promise<string> {
  const provider = await getProvider();
  const repoContext = buildRepoContext([repoIndex]);
  const otherRepos = allIndexes
    .filter((i) => i.repo !== repoIndex.repo)
    .map((i) => i.repo)
    .join(", ");

  const text = await provider.chat([
    {
      role: "system",
      content: `You are a senior software architect analyzing how a repository handles a specific concern.

Repository context:
${repoContext}

Other repositories in this project: ${otherRepos}

Analyze this repository's relevant code patterns for the feature described below. Focus on:
- Existing API contracts (endpoints, request/response shapes, field names, HTTP methods)
- Data models and schemas (database tables, TypeScript interfaces, validation rules)
- Authentication and authorization patterns (middleware, guards, token handling)
- Event/message patterns (emitted events, consumed events, queue names)
- Shared types or contracts (exported interfaces, DTOs, API client code)
- Naming conventions (camelCase vs snake_case, plural vs singular, prefixes)
- Error handling patterns (error codes, response formats, status codes)

Be specific: cite exact file paths, function names, field names, endpoint paths. Do not speculate — only describe what the code actually does.`,
    },
    {
      role: "user",
      content: `Analyze this repository's code patterns relevant to implementing: "${feature}"

Provide a thorough analysis covering all the areas above that are relevant. For each area, cite specific files and code patterns.`,
    },
  ], 4096);

  return text;
}

export async function crossReference(
  feature: string,
  repoAnalyses: Array<{ repo: string; analysis: string }>,
  allIndexes: RepoIndex[]
): Promise<DiscussConflict[]> {
  const provider = await getProvider();
  const repoContext = buildRepoContext(allIndexes);

  const analysesText = repoAnalyses
    .map((a) => `## ${a.repo}\n${a.analysis}`)
    .join("\n\n---\n\n");

  const text = await provider.chat([
    {
      role: "system",
      content: `You are a senior software architect reviewing multiple repository analyses to identify cross-repo conflicts and integration risks.

Here are the per-repo analyses:

${analysesText}

Full repository context:
${repoContext}

Identify concrete conflicts between these repositories for the described feature. For each conflict:
1. Describe what each repo expects or does differently, citing specific file paths and code references from each
2. Assess severity based on actual impact:
   - "high": Would cause runtime errors, data corruption, or security vulnerabilities if not resolved
   - "medium": Would cause degraded behavior, inconsistent UX, or require workarounds
   - "low": Style/convention differences that should be aligned but won't break functionality
3. Explain WHY you assigned that severity level
4. Suggest a specific resolution approach

Rules:
- Only report conflicts where you can cite specific references in BOTH repos
- Do NOT invent hypothetical conflicts — every conflict must be grounded in code evidence
- If two potential conflicts describe the same underlying issue, merge them into one
- Be thorough but precise — quality over quantity`,
    },
    {
      role: "user",
      content: `Feature: "${feature}"

Return ONLY valid JSON — an array of conflict objects:
[
  {
    "type": "conflict_type (e.g. endpoint_mismatch, schema_mismatch, field_naming, auth_contract, event_mismatch, response_shape, version_conflict)",
    "repoA": "first repo name",
    "repoARef": "specific file, endpoint, or field in first repo",
    "repoB": "second repo name",
    "repoBRef": "specific file, endpoint, or field in second repo",
    "description": "Detailed description of what each repo expects vs what the other does",
    "severity": "high|medium|low",
    "severityReason": "Why this severity level — what would happen if unresolved",
    "resolution": "Specific suggested fix (which repo should change, what the change looks like)"
  }
]

If no conflicts are found, return an empty array: []`,
    },
  ], 8192);

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try {
    const parsed = JSON.parse(jsonMatch[0]) as DiscussConflict[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function deepDive(
  feature: string,
  conflicts: DiscussConflict[],
  repoAnalyses: Array<{ repo: string; analysis: string }>,
  allIndexes: RepoIndex[]
): Promise<DiscussConflict[]> {
  const provider = await getProvider();
  const repoContext = buildRepoContext(allIndexes);

  const analysesText = repoAnalyses
    .map((a) => `## ${a.repo}\n${a.analysis}`)
    .join("\n\n---\n\n");

  const conflictsText = conflicts
    .map((c, i) => `${i + 1}. [${c.severity}] ${c.type}: ${c.description} (${c.repoA}:${c.repoARef} ↔ ${c.repoB}:${c.repoBRef})`)
    .join("\n");

  const text = await provider.chat([
    {
      role: "system",
      content: `You are a senior software architect performing a validation pass on cross-repo conflict analysis.

Per-repo analyses:
${analysesText}

Full repository context:
${repoContext}

Previously identified conflicts:
${conflictsText}

Your tasks:
1. Validate each conflict — is it real and accurately described? Remove any false positives.
2. Check if severity ratings are appropriate — upgrade or downgrade with reasoning.
3. Look for any MISSED conflicts not caught in the first pass.
4. Ensure resolution suggestions are actionable and specific.

Return the complete validated conflict list (existing + any new ones found).`,
    },
    {
      role: "user",
      content: `Feature: "${feature}"

Return ONLY valid JSON — the validated array of conflict objects with the same schema:
[
  {
    "type": "string",
    "repoA": "string",
    "repoARef": "string",
    "repoB": "string",
    "repoBRef": "string",
    "description": "string",
    "severity": "high|medium|low",
    "severityReason": "string",
    "resolution": "string"
  }
]`,
    },
  ], 8192);

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return conflicts;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as DiscussConflict[];
    return Array.isArray(parsed) ? parsed : conflicts;
  } catch {
    return conflicts;
  }
}
