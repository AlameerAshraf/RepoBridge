import { getGlobalConfig } from "./storage.js";
import { createProvider, DEFAULT_MODELS, } from "./providers/index.js";
async function getProvider() {
    const globalConfig = await getGlobalConfig();
    const providerName = (globalConfig.provider || "anthropic");
    const config = {
        provider: providerName,
        model: globalConfig.model || DEFAULT_MODELS[providerName] || "claude-sonnet-4-20250514",
        apiKey: globalConfig.apiKey,
        baseUrl: globalConfig.baseUrl,
    };
    return createProvider(config);
}
function buildRepoContext(indexes) {
    return indexes
        .map((idx) => {
        let ctx = `## Repository: ${idx.repo}\n`;
        ctx += `Indexed at: ${idx.indexedAt}\n\n`;
        if (idx.packageJson) {
            const pkg = idx.packageJson;
            ctx += `### package.json\n`;
            ctx += `Name: ${pkg.name || "N/A"}\n`;
            ctx += `Description: ${pkg.description || "N/A"}\n`;
            if (pkg.dependencies) {
                ctx += `Dependencies: ${Object.keys(pkg.dependencies).join(", ")}\n`;
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
export async function* askStream(question, indexes) {
    const provider = await getProvider();
    const repoContext = buildRepoContext(indexes);
    const stream = provider.chatStream([
        {
            role: "system",
            content: `You are RepoBridge, a cross-repo intelligence assistant. You have deep knowledge of the following repositories:\n\n${repoContext}\n\nWhen answering questions:\n- Always cite which repo and file your information comes from using [repo-name:file-path] format\n- If the question spans multiple repos, explain how they relate\n- Be specific about code, APIs, and data flows\n- If you're uncertain about something, say so`,
        },
        { role: "user", content: question },
    ]);
    for await (const chunk of stream) {
        yield chunk;
    }
}
export async function generatePlan(feature, indexes) {
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
export async function debateRound(repoName, repoIndex, feature, previousMessages, roundNumber) {
    const provider = await getProvider();
    const repoContext = buildRepoContext([repoIndex]);
    let conversationHistory = "";
    const alreadyFoundConflicts = [];
    if (previousMessages.length > 0) {
        conversationHistory = "\n\nPrevious messages:\n" +
            previousMessages.map((m) => {
                const conflictSummary = m.conflicts.length > 0
                    ? ` [conflicts: ${m.conflicts.map((c) => c.type).join(", ")}]`
                    : "";
                return `[${m.repo}]: ${m.statement}${conflictSummary}`;
            }).join("\n");
        for (const m of previousMessages) {
            for (const c of m.conflicts) {
                alreadyFoundConflicts.push(`${c.type}: ${c.description}`);
            }
        }
    }
    const alreadyFoundNote = alreadyFoundConflicts.length > 0
        ? `\n\nConflicts ALREADY found (DO NOT repeat these):\n${alreadyFoundConflicts.map((c) => `- ${c}`).join("\n")}`
        : "";
    const text = await provider.chat([
        {
            role: "system",
            content: `You are "${repoName}" in a technical debate about a cross-repo feature. Your codebase:\n\n${repoContext}\n\nRules:\n- Statement: 2-3 sentences about YOUR implementation approach. Be specific about files, endpoints, schemas.\n- Only report NEW conflicts not already found.\n- Each conflict description must clearly state: what YOU expect vs what THEY expect. Example: "Backend returns { user_id, created_at } but frontend expects { userId, createdAt } — needs field mapping or shared DTO"\n- my_ref: your specific file path, endpoint, field, or event name\n- their_ref: the other repo's specific file path, endpoint, field, or event name\n- If nothing new to add, return empty conflicts array.\n\nConflict types: endpoint_mismatch, field_naming, auth_contract, event_mismatch, response_shape, version_conflict, schema_mismatch`,
        },
        {
            role: "user",
            content: `Feature: "${feature}"\nRound ${roundNumber}.${conversationHistory}${alreadyFoundNote}\n\nReturn ONLY JSON:\n{"statement": "2-3 sentences, specific", "conflicts": [{"type": "type", "my_ref": "exact ref", "their_ref": "exact ref", "description": "What I expect vs what they expect — max 25 words"}]}`,
        },
    ], 1536);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        return { statement: text, conflicts: [] };
    }
    try {
        return JSON.parse(jsonMatch[0]);
    }
    catch {
        return { statement: text, conflicts: [] };
    }
}
//# sourceMappingURL=ai.js.map