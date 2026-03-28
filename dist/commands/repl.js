import readline from "node:readline";
import chalk from "chalk";
import { getActiveProject } from "../lib/storage.js";
import { setSharedReadline, clearSharedReadline } from "../lib/prompt.js";
import { header } from "../ui/theme.js";
import { initCommand } from "./init.js";
import { projectsCommand } from "./projects.js";
import { useCommand } from "./use.js";
import { addCommand } from "./add.js";
import { indexCommand } from "./index.js";
import { askCommand } from "./ask.js";
import { planCommand } from "./plan.js";
import { debateCommand } from "./debate.js";
import { sessionsCommand, sessionLoadCommand } from "./sessions.js";
import { statusCommand } from "./status.js";
import { configCommand } from "./config.js";
import { leaveCommand } from "./leave.js";
import { deleteCommand } from "./delete.js";
function printHelp() {
    console.log(chalk.bold.cyan("\n  Available Commands:\n"));
    const cmds = [
        ["init <name>", "Create a new project"],
        ["projects", "List all projects"],
        ["use <name>", "Switch active project"],
        ["add [path-or-url]", "Add repos (guided flow)"],
        ["index", "Re-index all repos"],
        ["ask <question>", "Ask a question about your repos"],
        ["plan <feature>", "Generate a cross-repo implementation plan"],
        ["debate [feature]", "Run a debate between repos"],
        ["sessions", "List saved Q&A sessions"],
        ["sessions load <id>", "Load a saved session"],
        ["status", "Show active project status"],
        ["config [options]", "Configure AI provider and model"],
        ["leave", "Deactivate current project"],
        ["delete [name]", "Delete a project and all its data"],
        ["help", "Show this help"],
        ["clear", "Clear the screen"],
        ["exit / quit", "Exit RepoBridge"],
    ];
    for (const [cmd, desc] of cmds) {
        console.log(`    ${chalk.bold(cmd.padEnd(24))} ${chalk.dim(desc)}`);
    }
    console.log();
}
async function getPromptPrefix() {
    const active = await getActiveProject();
    if (active) {
        return chalk.cyan(`repobridge`) + chalk.dim(`:`) + chalk.green(active) + chalk.dim(` > `);
    }
    return chalk.cyan(`repobridge`) + chalk.dim(` > `);
}
function parseArgs(input) {
    const args = [];
    let current = "";
    let inQuote = null;
    for (const char of input) {
        if (inQuote) {
            if (char === inQuote) {
                inQuote = null;
            }
            else {
                current += char;
            }
        }
        else if (char === '"' || char === "'") {
            inQuote = char;
        }
        else if (char === " ") {
            if (current) {
                args.push(current);
                current = "";
            }
        }
        else {
            current += char;
        }
    }
    if (current)
        args.push(current);
    return args;
}
async function executeCommand(args) {
    const cmd = args[0]?.toLowerCase();
    if (!cmd)
        return;
    try {
        switch (cmd) {
            case "init":
                if (!args[1]) {
                    console.log(chalk.red("  Usage: init <project-name>"));
                    return;
                }
                await initCommand(args[1]);
                break;
            case "projects":
                await projectsCommand();
                break;
            case "use":
                if (!args[1]) {
                    console.log(chalk.red("  Usage: use <project-name>"));
                    return;
                }
                await useCommand(args[1]);
                break;
            case "add":
                await addCommand(args[1]);
                break;
            case "index":
                await indexCommand();
                break;
            case "ask":
                if (!args[1]) {
                    console.log(chalk.red("  Usage: ask <question>"));
                    return;
                }
                await askCommand(args.slice(1).join(" "));
                break;
            case "plan": {
                if (!args[1]) {
                    console.log(chalk.red("  Usage: plan <feature>"));
                    return;
                }
                const exportFlag = args.includes("--export") ? args[args.indexOf("--export") + 1] : undefined;
                const featureWords = args.slice(1).filter((a) => a !== "--export" && a !== exportFlag);
                await planCommand(featureWords.join(" "), { export: exportFlag });
                break;
            }
            case "debate":
                await debateCommand(args[1] ? args.slice(1).join(" ") : undefined);
                break;
            case "sessions":
                if (args[1] === "load" && args[2]) {
                    await sessionLoadCommand(args[2]);
                }
                else {
                    await sessionsCommand();
                }
                break;
            case "status":
                await statusCommand();
                break;
            case "leave":
                await leaveCommand();
                break;
            case "delete":
                await deleteCommand(args[1]);
                break;
            case "config": {
                const opts = {};
                for (let i = 1; i < args.length; i++) {
                    const arg = args[i];
                    if (arg === "--show") {
                        opts.show = true;
                    }
                    else if (arg === "--provider" && args[i + 1]) {
                        opts.provider = args[++i];
                    }
                    else if (arg === "--model" && args[i + 1]) {
                        opts.model = args[++i];
                    }
                    else if (arg === "--api-key" && args[i + 1]) {
                        opts.apiKey = args[++i];
                    }
                    else if (arg === "--base-url" && args[i + 1]) {
                        opts.baseUrl = args[++i];
                    }
                }
                await configCommand(opts);
                break;
            }
            case "help":
                printHelp();
                break;
            case "clear":
                console.clear();
                console.log(header());
                break;
            default:
                console.log(chalk.red(`  Unknown command: ${cmd}`));
                console.log(chalk.dim("  Type 'help' for available commands"));
        }
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(`\n  Error: ${msg}\n`));
    }
}
export async function replCommand() {
    console.log(header());
    console.log(chalk.dim("  Interactive mode. Type 'help' for commands, 'exit' to quit.\n"));
    const active = await getActiveProject();
    if (active) {
        console.log(chalk.dim(`  Active project: ${chalk.green(active)}\n`));
    }
    else {
        console.log(chalk.yellow("  No active project. Run 'init <name>' or 'use <name>' to get started.\n"));
    }
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    // Share this readline with all commands so they don't create competing ones
    setSharedReadline(rl);
    rl.on("close", () => {
        clearSharedReadline();
        console.log(chalk.dim("\n  Goodbye!\n"));
        process.exit(0);
    });
    const loop = async () => {
        const prefix = await getPromptPrefix();
        rl.question(prefix, async (input) => {
            const trimmed = input.trim();
            if (trimmed === "exit" || trimmed === "quit" || trimmed === "q") {
                clearSharedReadline();
                console.log(chalk.dim("\n  Goodbye!\n"));
                rl.close();
                process.exit(0);
            }
            if (trimmed) {
                const args = parseArgs(trimmed);
                await executeCommand(args);
            }
            loop();
        });
    };
    loop();
}
//# sourceMappingURL=repl.js.map