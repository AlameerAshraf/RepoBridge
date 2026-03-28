import { listProjects, getActiveProject } from "../lib/storage.js";
import { header, hint, table, infoBox } from "../ui/theme.js";
import chalk from "chalk";
export async function projectsCommand() {
    console.log(header());
    const projects = await listProjects();
    const active = await getActiveProject();
    if (projects.length === 0) {
        console.log(infoBox("No projects yet.", "Projects"));
        console.log(hint('Create one with `repobridge init <name>`'));
        return;
    }
    const headers = ["", "Project", "Repos", "Last Used"];
    const rows = projects.map((p) => [
        p.name === active ? chalk.green("●") : " ",
        p.name === active ? chalk.bold.green(p.name) : p.name,
        String(p.repos.length),
        new Date(p.lastUsed).toLocaleDateString(),
    ]);
    console.log(chalk.bold.cyan("  Projects\n"));
    console.log("  " + table(headers, rows).split("\n").join("\n  "));
    console.log(hint('Switch projects with `repobridge use <name>`'));
}
//# sourceMappingURL=projects.js.map