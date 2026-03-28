import chalk from "chalk";
import { createProject } from "../lib/storage.js";
import { prompt } from "../lib/prompt.js";
import { header, successBox, hint } from "../ui/theme.js";
import { addCommand } from "./add.js";
export async function initCommand(name) {
    console.log(header());
    try {
        const config = await createProject(name);
        console.log(successBox(`Project: ${chalk.bold(name)}\n` +
            `Created: ${new Date(config.createdAt).toLocaleDateString()}\n` +
            `Status: Active`, "Project Created"));
        console.log(chalk.cyan("\n  Would you like to add repositories now?"));
        const answer = await prompt(chalk.dim("  (y/n) > "));
        if (answer.toLowerCase() === "y") {
            await addCommand();
        }
        else {
            console.log(hint('Next: `add` to add repos to your project'));
        }
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(`\nError: ${msg}`));
        process.exit(1);
    }
}
//# sourceMappingURL=init.js.map