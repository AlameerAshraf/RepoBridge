import chalk from "chalk";
import { getActiveProject, clearActiveProject } from "../lib/storage.js";
import { header, successBox, hint } from "../ui/theme.js";
export async function leaveCommand() {
    console.log(header());
    const active = await getActiveProject();
    if (!active) {
        console.log(chalk.yellow("  No active project to leave."));
        return;
    }
    await clearActiveProject();
    console.log(successBox(`Left project "${chalk.bold(active)}"`, "Project Deactivated"));
    console.log(hint('Switch to another: `use <project-name>` | List all: `projects`'));
}
//# sourceMappingURL=leave.js.map