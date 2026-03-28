import { setActiveProject, getProjectConfig } from "../lib/storage.js";
import { header, successBox, hint } from "../ui/theme.js";
import chalk from "chalk";
export async function useCommand(name) {
    console.log(header());
    try {
        const config = await getProjectConfig(name);
        await setActiveProject(name);
        console.log(successBox(`Active project: ${chalk.bold(name)}\n` +
            `Repos: ${config.repos.length}\n` +
            `Last used: ${new Date(config.lastUsed).toLocaleDateString()}`, "Project Activated"));
        console.log(hint('Run `repobridge status` to see project details'));
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(`\nError: ${msg}`));
        process.exit(1);
    }
}
//# sourceMappingURL=use.js.map