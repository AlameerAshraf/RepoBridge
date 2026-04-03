import chalk from "chalk";
import { getProjectConfig, deleteProject, listProjects, getActiveProject } from "../lib/storage.js";
import { prompt, PromptEOFError } from "../lib/prompt.js";
import { header, successBox, hint, errorBox } from "../ui/theme.js";

export async function deleteCommand(name?: string): Promise<void> {
  console.log(header());

  try {
    // If no name given, show list and ask
    if (!name) {
      const projects = await listProjects();
      if (projects.length === 0) {
        console.log(chalk.yellow("  No projects to delete."));
        return;
      }

      const active = await getActiveProject();
      console.log(chalk.bold.cyan("  Select a project to delete:\n"));
      projects.forEach((p, i) => {
        const marker = p.name === active ? chalk.green(" (active)") : "";
        console.log(`    ${chalk.bold(`${i + 1})`)} ${p.name}${marker} — ${p.repos.length} repos`);
      });
      console.log();

      const choice = await prompt(chalk.green("  number > "));
      const idx = parseInt(choice.trim(), 10) - 1;
      if (isNaN(idx) || idx < 0 || idx >= projects.length) {
        console.log(chalk.yellow("  Cancelled."));
        return;
      }
      name = projects[idx]!.name;
    }

    // Confirm
    const config = await getProjectConfig(name);
    console.log(chalk.red(`\n  This will permanently delete project "${chalk.bold(name)}":`));
    console.log(chalk.dim(`    Repos: ${config.repos.map((r) => r.name).join(", ") || "none"}`));
    console.log(chalk.dim(`    All sessions, plans, discussions, and indexes will be removed.\n`));

    const answer = await prompt(chalk.red(`  Type "${name}" to confirm > `));

    if (answer.trim() !== name) {
      console.log(chalk.yellow("\n  Cancelled. Project was not deleted."));
      return;
    }

    await deleteProject(name);

    console.log(
      successBox(`Project "${chalk.bold(name)}" has been deleted.`, "Project Deleted")
    );

    console.log(hint('Run `projects` to see remaining projects'));
  } catch (err) {
    if (err instanceof PromptEOFError) {
      console.log(chalk.yellow("\n  Cancelled."));
      return;
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error(errorBox(msg));
  }
}
