import chalk from "chalk";
import { requireActiveProject, listSessions, getSession } from "../lib/storage.js";
import { header, hint, table, infoBox } from "../ui/theme.js";
import { formatMarkdown } from "../ui/markdown.js";

export async function sessionsCommand(): Promise<void> {
  console.log(header());

  try {
    const projectName = await requireActiveProject();
    const sessions = await listSessions(projectName);

    if (sessions.length === 0) {
      console.log(infoBox("No saved sessions yet.", "Sessions"));
      console.log(hint('Start a session with `repobridge ask "your question"`'));
      return;
    }

    console.log(chalk.bold.cyan("  Sessions\n"));

    const headers = ["ID", "Date", "Question", "Repos"];
    const rows = sessions.map((s) => [
      s.id,
      new Date(s.timestamp).toLocaleDateString(),
      s.question.length > 40 ? s.question.slice(0, 40) + "..." : s.question,
      s.repos.join(", "),
    ]);

    console.log("  " + table(headers, rows).split("\n").join("\n  "));
    console.log(hint('Load a session: `repobridge sessions load <id>`'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(`\nError: ${msg}`));
    process.exit(1);
  }
}

export async function sessionLoadCommand(id: string): Promise<void> {
  console.log(header());

  try {
    const projectName = await requireActiveProject();
    const session = await getSession(projectName, id);

    if (!session) {
      console.log(chalk.red(`  Session "${id}" not found.`));
      return;
    }

    console.log(chalk.bold.cyan("  Session Replay\n"));
    console.log(chalk.dim(`  Date: ${new Date(session.timestamp).toLocaleString()}`));
    console.log(chalk.dim(`  Repos: ${session.repos.join(", ")}\n`));
    console.log(chalk.bold(`  Q: ${session.question}\n`));
    console.log(chalk.dim("  " + "─".repeat(50)));
    console.log(formatMarkdown(session.answer));
    console.log("\n" + chalk.dim("  " + "─".repeat(50)));

    console.log(hint('Follow up: `ask "related question"`'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(`\nError: ${msg}`));
    process.exit(1);
  }
}
