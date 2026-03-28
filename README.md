<p align="center">
  <pre align="center">
  ╦═╗┌─┐┌─┐┌─┐╔╗ ┬─┐┬┌┬┐┌─┐┌─┐
  ╠╦╝├┤ ├─┘│ │╠╩╗├┬┘│ │││ ┬├┤
  ╩╚═└─┘┴  └─┘╚═╝┴└─┴─┴┘└─┘└─┘
  </pre>
  <strong>Cross-repo intelligence CLI</strong><br>
  <em>Research, plan, and ship features that span multiple repositories.</em>
</p>

<p align="center">
  <a href="https://github.com/AlameerAshraf/RepoBridge/actions/workflows/ci.yml"><img src="https://github.com/AlameerAshraf/RepoBridge/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-yellow?style=flat-square" alt="License: MIT"></a>
  <a href="https://github.com/AlameerAshraf/RepoBridge/stargazers"><img src="https://img.shields.io/github/stars/AlameerAshraf/RepoBridge?style=flat-square&logo=github" alt="GitHub stars"></a>
  <a href="https://github.com/AlameerAshraf/RepoBridge/network/members"><img src="https://img.shields.io/github/forks/AlameerAshraf/RepoBridge?style=flat-square&logo=github" alt="GitHub forks"></a>
  <a href="https://github.com/AlameerAshraf/RepoBridge/issues"><img src="https://img.shields.io/github/issues/AlameerAshraf/RepoBridge?style=flat-square" alt="Issues"></a>
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square" alt="Node">
  <img src="https://img.shields.io/badge/typescript-5.x-blue?style=flat-square" alt="TypeScript">
  <img src="https://img.shields.io/badge/AI-multi--provider-purple?style=flat-square" alt="Multi-Provider AI">
  <a href="http://makeapullrequest.com"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs Welcome"></a>
  <a href="https://opensource.org/"><img src="https://badges.frapsoft.com/os/v3/open-source.svg?v=103" alt="Open Source"></a>
</p>

---

## The Problem

You're building a feature that touches 3 repos — a backend API, a frontend app, and a shared library. You need to:

- Understand how auth works across all of them
- Plan which files to create/modify in each repo
- Catch that the backend returns `snake_case` but the frontend expects `camelCase`
- Find out the event names don't match between producer and consumer

You'd normally spend hours reading code across repos, mentally mapping dependencies, and discovering conflicts mid-implementation.

**RepoBridge does this in seconds.**

---

## What It Does

| Feature | Description |
|---------|-------------|
| **Ask** | Ask questions about your codebase with full cross-repo context. AI cites specific repos and files. |
| **Plan** | Generate detailed implementation plans with per-file tasks, implementation details, and dependency ordering. Auto-exports a structured README. |
| **Debate** | Repos "argue" about a feature — each repo responds as itself, finding endpoint mismatches, naming conflicts, auth disagreements, and schema differences. |
| **Index** | Scans repos for file trees, API routes, exports, events, auth patterns, and env vars. Feeds this as context to AI. |

---

## Quick Start

```bash
# Install
git clone https://github.com/AlameerAshraf/RepoBridge.git
cd repobridge
npm install && npm run build && npm link

# Launch interactive mode
repobridge
```

Inside the session:

```
repobridge > init my-platform
repobridge:my-platform > add
  repo 1 > /path/to/backend
  repo 2 > /path/to/frontend
  choice (1/2) > 2

repobridge:my-platform > ask "How does authentication flow from frontend to backend?"
repobridge:my-platform > plan "Add Stripe billing with usage-based pricing"
repobridge:my-platform > debate "API contract for billing endpoints"
```

---

## AI Providers

RepoBridge is **model-agnostic**. Switch providers with one command:

```
config --provider anthropic                  # Claude (default)
config --provider openai --model gpt-4o      # OpenAI
config --provider deepseek --model deepseek-chat --base-url https://api.deepseek.com/v1
config --provider gemini --model gemini-2.0-flash
config --provider ollama --model llama3.1     # Local, no API key needed
```

| Provider | Default Model | Auth |
|----------|---------------|------|
| `anthropic` | `claude-sonnet-4-20250514` | `ANTHROPIC_API_KEY` |
| `openai` | `gpt-4o` | `OPENAI_API_KEY` |
| `gemini` | `gemini-2.0-flash` | `GEMINI_API_KEY` |
| `ollama` | `llama3.1` | None (local) |

Any OpenAI-compatible API works via `--provider openai --base-url <url>` (DeepSeek, Groq, Together, Azure, etc.)

---

## Commands

### Project Management

| Command | Description |
|---------|-------------|
| `init <name>` | Create a new project |
| `projects` | List all projects |
| `use <name>` | Switch active project |
| `leave` | Deactivate current project |
| `delete [name]` | Delete a project (with confirmation) |
| `status` | Show project dashboard — repos, index status, plans, AI provider |

### Repository Management

| Command | Description |
|---------|-------------|
| `add [path-or-url]` | Guided flow to add repos (enforces minimum 2). Supports local paths and GitHub URLs. Auto-indexes on add. |
| `index` | Re-index all repos in the active project |

### AI-Powered Features

| Command | Description |
|---------|-------------|
| `ask "<question>"` | Ask anything about your repos. Streams a formatted response with repo/file citations. Session auto-saved. |
| `plan "<feature>"` | Generate a detailed implementation plan. Per-file tasks with implementation details, dependencies, and concerns. Auto-exports a structured README. |
| `debate [feature]` | Multi-round debate between repos. Each repo identifies conflicts with others — endpoint mismatches, naming issues, auth gaps, schema differences. |

### Session Management

| Command | Description |
|---------|-------------|
| `sessions` | List saved Q&A sessions |
| `sessions load <id>` | Replay a past session |
| `config` | View/change AI provider and model |

---

## Repo Indexing

When you add a repo, RepoBridge scans it and extracts:

| Data | Source |
|------|--------|
| File tree | All files up to depth 4 (excludes `node_modules`, `.git`, etc.) |
| Package info | `package.json` — name, description, dependencies |
| Documentation | `README.md` (first 3000 chars) |
| API routes | Express, Fastify, FastAPI, Flask route patterns |
| Exports | Functions, classes, and constants from index/entry files |
| Events | `emit()`, `publish()`, `subscribe()` patterns + queue/topic names |
| Auth | Files matching middleware, auth, jwt, oauth, passport patterns |
| Environment | `.env.example`, `.env.sample` files |
| API specs | `openapi.yaml`, `swagger.json` |

This structured index becomes the AI's knowledge base for ask, plan, and debate.

---

## Debate Mode

Debate mode is RepoBridge's killer feature. It simulates a conversation between your repos to find integration conflicts **before you write code**.

```
repobridge:my-app > debate "Add real-time notifications"
```

**How it works:**

1. Each repo gets its own AI call with a system prompt: *"You are the backend repo. Find conflicts with what other repos expect."*
2. Repos exchange messages across rounds (max 3), building on what others said
3. Conflicts are deduplicated with fuzzy matching (same type + >60% word overlap = duplicate)
4. Final report groups conflicts by severity

**Conflict types detected:**

| Type | Example |
|------|---------|
| `endpoint_mismatch` | Backend serves `/api/users`, frontend calls `/users` |
| `field_naming` | Backend returns `created_at`, frontend expects `createdAt` |
| `auth_contract` | Backend expects Bearer token, frontend sends session cookie |
| `event_mismatch` | Producer emits `user.created`, consumer listens for `user_created` |
| `response_shape` | Backend returns `{ data: [...] }`, frontend expects `{ results: [...] }` |
| `version_conflict` | Backend uses v2 of shared lib, frontend pins v1 |
| `schema_mismatch` | Backend has `email` as required, frontend form treats it as optional |

---

## Plan Output

Every `plan` command generates a structured README at `~/.repobridge/projects/<name>/plans/<id>-plan.md`:

```markdown
# Implementation Plan

> **Add Stripe billing with usage-based pricing**

| | |
|---|---|
| **Project** | my-platform |
| **Repos** | 2 |
| **Tasks** | 14 |
| **Blockers** | 3 (1 high) |

## backend

### 1. 🟢 CREATE `src/models/Subscription.ts`
Subscription model with Stripe integration

- Fields: id, userId, stripeCustomerId, plan, status, currentPeriodEnd
- Methods: isActive(), cancel(), changePlan()
- Stripe webhook handler for subscription.updated events

> **Depends on:** `src/models/User.ts`

### 2. 🟡 MODIFY `src/routes/index.ts`
Register billing routes

- Add /api/billing/* route group
- Apply auth middleware to all billing endpoints
...

## Blockers

### 🔴 High Severity

**1. endpoint_mismatch**
- Backend serves billing at /api/billing/subscribe but frontend calls /billing/create-subscription
- Source: `/api/billing/subscribe`
- Target: `/billing/create-subscription`

## Checklist

- [ ] **CREATE** `src/models/Subscription.ts` — Subscription model
- [ ] **MODIFY** `src/routes/index.ts` — Register billing routes
...
```

---

## Interactive Mode

Run `repobridge` with no arguments to enter a persistent interactive session:

```
$ repobridge

  ╦═╗┌─┐┌─┐┌─┐╔╗ ┬─┐┬┌┬┐┌─┐┌─┐
  ╠╦╝├┤ ├─┘│ │╠╩╗├┬┘│ │││ ┬├┤
  ╩╚═└─┘┴  └─┘╚═╝┴└─┴─┴┘└─┘└─┘

  Interactive mode. Type 'help' for commands, 'exit' to quit.

repobridge > init my-app
repobridge:my-app > add
repobridge:my-app > ask "How does the API handle auth?"
repobridge:my-app > plan "Add user notifications"
repobridge:my-app > debate
repobridge:my-app > status
repobridge:my-app > exit
```

All commands work the same as one-off CLI calls. The prompt shows your active project.

---

## Data Storage

Everything is stored locally. No cloud, no telemetry.

```
~/.repobridge/
├── config.json                 ← active project + AI provider config
├── repos/                      ← cloned GitHub repos
└── projects/
    └── <project-name>/
        ├── config.json         ← repos list + metadata
        ├── index/
        │   └── <repo>.json     ← indexed repo context
        ├── sessions/
        │   └── <id>.json       ← saved Q&A sessions
        ├── plans/
        │   ├── <id>.json       ← plan data
        │   └── <id>-plan.md    ← generated README
        └── debates/
            └── <id>.json       ← debate results + conflicts
```

---

## Architecture

```
src/
├── index.ts                    ← CLI entry point (commander + REPL)
├── commands/
│   ├── init.ts                 ← Project creation
│   ├── projects.ts             ← List projects
│   ├── use.ts / leave.ts       ← Switch/deactivate project
│   ├── add.ts                  ← Guided repo adding flow
│   ├── index.ts                ← Repo indexing
│   ├── ask.ts                  ← AI Q&A with streaming
│   ├── plan.ts                 ← Plan generation + README export
│   ├── debate.ts               ← Multi-round repo debate
│   ├── delete.ts               ← Project deletion
│   ├── sessions.ts             ← Session management
│   ├── status.ts               ← Project dashboard
│   ├── config.ts               ← AI provider configuration
│   └── repl.ts                 ← Interactive session loop
├── lib/
│   ├── ai.ts                   ← AI orchestration (ask, plan, debate prompts)
│   ├── debate.ts               ← Debate engine (rounds, dedup, severity)
│   ├── indexer.ts              ← Repo scanning (files, routes, exports, events)
│   ├── storage.ts              ← Data types + file I/O
│   ├── prompt.ts               ← Shared readline for REPL
│   └── providers/
│       ├── base.ts             ← LLMProvider interface
│       ├── index.ts            ← Provider factory
│       ├── anthropic.ts        ← Claude (via SDK)
│       ├── openai.ts           ← OpenAI-compatible (native fetch)
│       ├── gemini.ts           ← Google Gemini (native fetch)
│       └── ollama.ts           ← Ollama local (native fetch)
└── ui/
    ├── theme.ts                ← Styled output (boxes, tables, colors)
    └── markdown.ts             ← Terminal markdown renderer
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | If using Anthropic | Claude API key |
| `OPENAI_API_KEY` | If using OpenAI | OpenAI API key |
| `GEMINI_API_KEY` | If using Gemini | Google AI API key |

Ollama requires no API key. Keys can also be set via `config --api-key`.

---

## Requirements

- Node.js >= 18
- npm
- `grep` (pre-installed on macOS/Linux) — used for event/auth scanning during indexing

---

## Tests

Unit tests use [Vitest](https://vitest.dev/). Run:

```bash
npm install
npm test
```

Example output (abridged):

```text
 RUN  v3.2.4

 ✓ src/lib/providers/base.test.ts (2 tests) 1ms
 ✓ src/ui/markdown.test.ts (4 tests) 2ms
 ✓ src/lib/storage.test.ts (5 tests) 48ms

 Test Files  3 passed (3)
      Tests  11 passed (11)
   Duration  ~250ms
```

CI runs `npm ci`, `npm run build`, and `npm test` on every push and pull request to `main` (see workflow badge above).

---

## License

MIT

---

<p align="center">
  <em>Stop reading code across 5 repos. Let them talk to each other.</em>
</p>
