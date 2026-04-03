import chalk from "chalk";
import { requireActiveProject, listSessions, getSession, deleteSession } from "../lib/storage.js";
import { prompt, PromptEOFError } from "../lib/prompt.js";
import { header, hint, table, infoBox, successBox } from "../ui/theme.js";
import { formatMarkdown } from "../ui/markdown.js";
export async function sessionsCommand() {
    console.log(header());
    try {
        const projectName = await requireActiveProject();
        const sessions = await listSessions(projectName);
        if (sessions.length === 0) {
            console.log(infoBox("No saved sessions yet.", "Sessions"));
            console.log(hint('Start a session with `ask "your question"`'));
            return;
        }
        console.log(chalk.bold.cyan("  Sessions\n"));
        const headers = ["ID", "Date", "Model", "Question", "Repos"];
        const rows = sessions.map((s) => [
            s.id.length > 8 ? s.id.slice(0, 8) : s.id,
            new Date(s.timestamp).toLocaleDateString(),
            s.model || s.provider || "—",
            s.question.length > 35 ? s.question.slice(0, 35) + "..." : s.question,
            s.repos.join(", "),
        ]);
        console.log("  " + table(headers, rows).split("\n").join("\n  "));
        console.log(hint('Load: `sessions load <id>` | Delete: `sessions delete <id>`'));
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(`\nError: ${msg}`));
        process.exit(1);
    }
}
export async function sessionLoadCommand(id) {
    console.log(header());
    try {
        const projectName = await requireActiveProject();
        // Support partial ID matching
        const session = await findSession(projectName, id);
        if (!session) {
            console.log(chalk.red(`  Session "${id}" not found.`));
            console.log(hint('Run `sessions` to see available sessions'));
            return;
        }
        if (!session.answer || session.answer.trim() === "") {
            console.log(chalk.yellow("  This session has no answer recorded."));
            console.log(chalk.dim(`  Q: ${session.question}`));
            return;
        }
        console.log(chalk.bold.cyan("  Session Replay\n"));
        console.log(chalk.dim(`  Date: ${new Date(session.timestamp).toLocaleString()}`));
        console.log(chalk.dim(`  Repos: ${session.repos.join(", ")}`));
        if (session.provider || session.model) {
            console.log(chalk.dim(`  Model: ${session.provider || ""}${session.model ? ` / ${session.model}` : ""}`));
        }
        console.log(chalk.bold(`\n  Q: ${session.question}\n`));
        console.log(chalk.dim("  " + "─".repeat(50)));
        console.log(formatMarkdown(session.answer));
        console.log("\n" + chalk.dim("  " + "─".repeat(50)));
        console.log(hint('Follow up: `ask "related question"`'));
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(`\nError: ${msg}`));
        process.exit(1);
    }
}
export async function sessionDeleteCommand(id) {
    try {
        const projectName = await requireActiveProject();
        const session = await findSession(projectName, id);
        if (!session) {
            console.log(chalk.red(`  Session "${id}" not found.`));
            return;
        }
        console.log(chalk.dim(`  Q: ${session.question}`));
        console.log(chalk.dim(`  Date: ${new Date(session.timestamp).toLocaleString()}\n`));
        const answer = await prompt(chalk.red("  Delete this session? (y/n) > "));
        if (answer.trim().toLowerCase() !== "y") {
            console.log(chalk.yellow("  Cancelled."));
            return;
        }
        const deleted = await deleteSession(projectName, session.id);
        if (deleted) {
            console.log(successBox("Session deleted.", "Done"));
        }
        else {
            console.log(chalk.red("  Failed to delete session."));
        }
    }
    catch (err) {
        if (err instanceof PromptEOFError) {
            console.log(chalk.yellow("\n  Cancelled."));
            return;
        }
        const msg = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(`\nError: ${msg}`));
    }
}
async function findSession(projectName, id) {
    // Try exact match first
    const exact = await getSession(projectName, id);
    if (exact)
        return exact;
    // Try partial ID match (first 8 chars of UUID)
    const sessions = await listSessions(projectName);
    return sessions.find((s) => s.id.startsWith(id)) || null;
}
//# sourceMappingURL=sessions.js.map