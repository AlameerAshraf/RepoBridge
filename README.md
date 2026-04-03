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
  <a href="https://www.npmjs.com/package/repobridge"><img src="https://img.shields.io/npm/v/repobridge?style=flat-square&color=red" alt="npm"></a>
  <a href="https://github.com/AlameerAshraf/RepoBridge/actions/workflows/ci.yml"><img src="https://github.com/AlameerAshraf/RepoBridge/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-yellow?style=flat-square" alt="License: MIT"></a>
  <a href="https://github.com/AlameerAshraf/RepoBridge/stargazers"><img src="https://img.shields.io/github/stars/AlameerAshraf/RepoBridge?style=flat-square&logo=github" alt="GitHub stars"></a>
  <a href="https://github.com/AlameerAshraf/RepoBridge/network/members"><img src="https://img.shields.io/github/forks/AlameerAshraf/RepoBridge?style=flat-square&logo=github" alt="GitHub forks"></a>
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square" alt="Node">
  <img src="https://img.shields.io/badge/typescript-5.x-blue?style=flat-square" alt="TypeScript">
  <img src="https://img.shields.io/badge/AI-multi--provider-purple?style=flat-square" alt="Multi-Provider AI">
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
| **Ask** | Ask questions about your codebase with full cross-repo context. Concise answers with repo/file citations. |
| **Plan** | Generate detailed implementation plans with per-file tasks, dependency ordering, and cross-cutting concerns. Auto-exports a structured markdown report. |
| **Discuss** | Multi-phase cross-repo analysis — each repo is analyzed individually, then cross-referenced for conflicts with severity ratings and resolution suggestions. |
| **Index** | Scans repos for file trees, API routes, exports, events, auth patterns, and env vars. Feeds this as context to AI. |

---

## Install

```bash
# From npm (recommended)
npm install -g repobridge

# Or try without installing
npx repobridge

# Or from source
git clone https://github.com/AlameerAshraf/RepoBridge.git
cd RepoBridge
npm install && npm run build && npm link
```

---

## Quick Start

```bash
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
repobridge:my-platform > discuss "API contract for billing endpoints"
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
| `status` | Project dashboard — repos, file/route counts, plans, discussions, AI provider |

### Repository Management

| Command | Description |
|---------|-------------|
| `add [path-or-url]` | Guided flow to add repos (minimum 2 required). Supports local paths and GitHub URLs. Auto-indexes on add. |
| `index` | Re-index all repos in the active project |

### AI-Powered Features

| Command | Description |
|---------|-------------|
| `ask "<question>"` | Ask anything about your repos. Concise, direct answers with key file citations. Session auto-saved with model info. |
| `plan "<feature>"` | Generate a cross-repo implementation plan. Per-file tasks with details, dependencies, and concerns. Exports markdown report. |
| `discuss [feature]` | Three-phase cross-repo analysis: per-repo deep analysis → cross-reference for conflicts → validation pass. Each conflict includes severity reasoning and a resolution suggestion. |

### Session Management

| Command | Description |
|---------|-------------|
| `sessions` | List saved sessions with date, model, and question |
| `sessions load <id>` | Replay a past session (supports partial ID match) |
| `sessions delete <id>` | Delete a saved session |
| `config` | View/change AI provider and model |

---

## Discuss Mode

Discuss mode is RepoBridge's core feature. It finds integration conflicts **before you write code**.

```
repobridge:my-app > discuss "Add real-time notifications"
```

**How it works:**

1. **Analysis phase** — Each repo is analyzed individually by the AI, grounded in actual code. The AI examines API contracts, data models, auth patterns, events, and naming conventions.
2. **Cross-reference phase** — All repo analyses are compared in a single pass to identify concrete conflicts with code evidence from both sides.
3. **Validation phase** — If conflicts are found, a final pass validates them, removes false positives, and catches anything missed.

Each conflict includes:
- **What's wrong** — detailed description citing specific files/endpoints in both repos
- **Severity** — high/medium/low with reasoning (based on actual impact, not just type)
- **Resolution** — specific suggested fix

**Conflict types detected:**

| Type | Example |
|------|---------|
| `endpoint_mismatch` | Backend serves `/api/users`, frontend calls `/users` |
| `field_naming` | Backend returns `created_at`, frontend expects `createdAt` |
| `auth_contract` | Backend expects Bearer token, frontend sends session cookie |
| `event_mismatch` | Producer emits `user.created`, consumer listens for `user_created` |
| `response_shape` | Backend returns `{ data: [...] }`, frontend expects `{ results: [...] }` |
| `schema_mismatch` | Backend has `email` as required, frontend form treats it as optional |

A full markdown report is saved to `~/.repobridge/projects/<name>/discussions/<id>-discussion.md`.

---

## Plan Output

Every `plan` command generates a structured markdown report at `~/.repobridge/projects/<name>/plans/<id>-plan.md`:

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

### 1. + CREATE `src/models/Subscription.ts`
Subscription model with Stripe integration

- Fields: id, userId, stripeCustomerId, plan, status, currentPeriodEnd
- Stripe webhook handler for subscription.updated events

> **Depends on:** `src/models/User.ts`

### 2. ~ MODIFY `src/routes/index.ts`
Register billing routes

- Add /api/billing/* route group
- Apply auth middleware to all billing endpoints
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
repobridge:my-app > discuss
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
        │   └── <id>.json       ← saved Q&A sessions (with model info)
        ├── plans/
        │   ├── <id>.json       ← plan data
        │   └── <id>-plan.md    ← generated markdown report
        └── discussions/
            ├── <id>.json       ← discussion results + conflicts
            └── <id>-discussion.md  ← generated markdown report
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
│   ├── plan.ts                 ← Plan generation + markdown export
│   ├── discuss.ts              ← Three-phase cross-repo discussion
│   ├── delete.ts               ← Project deletion
│   ├── sessions.ts             ← Session management (list, load, delete)
│   ├── status.ts               ← Project dashboard
│   ├── config.ts               ← AI provider configuration
│   └── repl.ts                 ← Interactive session loop
├── lib/
│   ├── ai.ts                   ← AI orchestration (ask, plan, discuss prompts)
│   ├── discuss.ts              ← Discussion engine (analyze, cross-reference, validate)
│   ├── indexer.ts              ← Repo scanning (files, routes, exports, events)
│   ├── storage.ts              ← Data types + file I/O
│   ├── prompt.ts               ← Shared readline with EOF handling
│   └── providers/
│       ├── base.ts             ← LLMProvider interface
│       ├── index.ts            ← Provider factory
│       ├── anthropic.ts        ← Claude (via SDK)
│       ├── openai.ts           ← OpenAI-compatible (native fetch)
│       ├── gemini.ts           ← Google Gemini (native fetch)
│       └── ollama.ts           ← Ollama local (native fetch)
└── ui/
    ├── theme.ts                ← Layout system, boxes, tables, icons
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

---

## Tests

```bash
npm test
```

CI runs build + tests on every push and PR to `main`.

---

## License

MIT

---

<p align="center">
  <em>Stop reading code across 5 repos. Let them talk to each other.</em>
</p>
