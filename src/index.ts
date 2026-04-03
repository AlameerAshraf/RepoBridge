#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { projectsCommand } from "./commands/projects.js";
import { useCommand } from "./commands/use.js";
import { addCommand } from "./commands/add.js";
import { indexCommand } from "./commands/index.js";
import { askCommand } from "./commands/ask.js";
import { planCommand } from "./commands/plan.js";
import { discussCommand } from "./commands/discuss.js";
import { sessionsCommand, sessionLoadCommand, sessionDeleteCommand } from "./commands/sessions.js";
import { statusCommand } from "./commands/status.js";
import { configCommand } from "./commands/config.js";
import { leaveCommand } from "./commands/leave.js";
import { deleteCommand } from "./commands/delete.js";
import { replCommand } from "./commands/repl.js";

const program = new Command();

program
  .name("repobridge")
  .description("Cross-repo intelligence CLI — research, plan, and implement features spanning multiple repositories")
  .version("1.0.0");

program
  .command("init <project-name>")
  .description("Create a new RepoBridge project")
  .action(initCommand);

program
  .command("projects")
  .description("List all projects")
  .action(projectsCommand);

program
  .command("use <project-name>")
  .description("Set the active project")
  .action(useCommand);

program
  .command("add [repo-path-or-url]")
  .description("Add repos to the active project (guided flow)")
  .action((repoPath?: string) => addCommand(repoPath));

program
  .command("index")
  .description("Re-index all repos in the active project")
  .action(indexCommand);

program
  .command("ask <question>")
  .description("Ask a question about your repos using AI")
  .action(askCommand);

program
  .command("plan <feature>")
  .description("Generate a cross-repo implementation plan")
  .option("--export <format>", "Export format: markdown or github")
  .action(planCommand);

program
  .command("discuss [feature]")
  .description("Run a cross-repo discussion to find conflicts")
  .action((feature?: string) => discussCommand(feature));

// Hidden alias for backwards compatibility
program
  .command("debate [feature]", { hidden: true })
  .action((feature?: string) => discussCommand(feature));

const sessionsCmd = program
  .command("sessions")
  .description("List saved Q&A sessions")
  .action(sessionsCommand);

sessionsCmd
  .command("load <id>")
  .description("Load a saved session")
  .action(sessionLoadCommand);

sessionsCmd
  .command("delete <id>")
  .description("Delete a saved session")
  .action(sessionDeleteCommand);

program
  .command("status")
  .description("Show active project status")
  .action(statusCommand);

program
  .command("config")
  .description("Configure AI provider and model")
  .option("--provider <name>", "AI provider: anthropic, openai, gemini, ollama")
  .option("--model <name>", "Model name (e.g. gpt-4o, claude-sonnet-4-20250514)")
  .option("--api-key <key>", "API key for the provider")
  .option("--base-url <url>", "Custom API base URL")
  .option("--show", "Show current configuration")
  .action(configCommand);

program
  .command("leave")
  .description("Deactivate the current project")
  .action(leaveCommand);

program
  .command("delete [project-name]")
  .description("Delete a project and all its data")
  .action((name?: string) => deleteCommand(name));

program
  .command("shell")
  .description("Start interactive session")
  .action(replCommand);

// If no command given, launch interactive mode
if (process.argv.length <= 2) {
  replCommand();
} else {
  program.parse();
}
