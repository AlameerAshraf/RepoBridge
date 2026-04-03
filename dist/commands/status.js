import chalk from "chalk";
import { requireActiveProject, getProjectConfig, getGlobalConfig, getRepoIndex, listPlans, listSessions, listDiscussions, } from "../lib/storage.js";
import { DEFAULT_MODELS } from "../lib/providers/index.js";
import { header, hint, repoLabel, section, keyValue, INDENT } from "../ui/theme.js";
export async function statusCommand() {
    console.log(header());
    try {
        const projectName = await requireActiveProject();
        const config = await getProjectConfig(projectName);
        const plans = await listPlans(projectName);
        const sessions = await listSessions(projectName);
        const discussions = await listDiscussions(projectName);
        console.log(chalk.bold.cyan(`${INDENT}Project: ${chalk.white(projectName)}\n`));
        const globalConfig = await getGlobalConfig();
        const provider = (globalConfig.provider || "anthropic");
        const model = globalConfig.model || DEFAULT_MODELS[provider];
        console.log(keyValue("Created", new Date(config.createdAt).toLocaleDateString()));
        console.log(keyValue("Last used", new Date(config.lastUsed).toLocaleDateString()));
        console.log(keyValue("AI", `${provider} / ${model}`));
        // Repos & index status
        console.log(section("Repositories"));
        if (config.repos.length === 0) {
            console.log(chalk.yellow(`${INDENT}  No repos added yet.`));
        }
        else {
            let totalFiles = 0;
            let totalRoutes = 0;
            for (const repo of config.repos) {
                const index = await getRepoIndex(projectName, repo.name);
                if (index) {
                    totalFiles += index.fileTree.length;
                    totalRoutes += index.apiRoutes.length;
                    const indexInfo = chalk.green(`indexed ${new Date(index.indexedAt).toLocaleDateString()} (${index.fileTree.length} files, ${index.apiRoutes.length} routes)`);
                    console.log(`${INDENT}  ${repoLabel(repo.name)} ${chalk.dim(repo.path)}`);
                    console.log(`${INDENT}    ${indexInfo}`);
                }
                else {
                    console.log(`${INDENT}  ${repoLabel(repo.name)} ${chalk.dim(repo.path)}`);
                    console.log(`${INDENT}    ${chalk.yellow("not indexed")}`);
                }
            }
            if (totalFiles > 0) {
                console.log(`\n${INDENT}${chalk.dim(`Total: ${totalFiles} files, ${totalRoutes} API routes across ${config.repos.length} repos`)}`);
            }
        }
        // Activity summary
        console.log(section("Activity"));
        console.log(keyValue("Plans", String(plans.length)));
        console.log(keyValue("Sessions", String(sessions.length)));
        console.log(keyValue("Discussions", String(discussions.length)));
        if (plans.length > 0) {
            const latest = plans[0];
            console.log(`\n${INDENT}${chalk.dim("Latest plan:")} "${latest.feature}" ${chalk.dim(`(${new Date(latest.timestamp).toLocaleDateString()})`)}`);
            if (latest.blockers && latest.blockers.length > 0) {
                const high = latest.blockers.filter((b) => b.severity === "high").length;
                console.log(`${INDENT}${chalk.red(`⚠ ${latest.blockers.length} unresolved conflicts${high > 0 ? ` (${high} high)` : ""}`)}`);
            }
        }
        if (discussions.length > 0) {
            const latest = discussions[0];
            console.log(`${INDENT}${chalk.dim("Latest discussion:")} "${latest.feature}" — ${latest.conflicts.length} conflicts ${chalk.dim(`(${new Date(latest.timestamp).toLocaleDateString()})`)}`);
        }
        console.log(hint('Commands: ask, plan, discuss, index, sessions'));
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(`\nError: ${msg}`));
        process.exit(1);
    }
}
//# sourceMappingURL=status.js.map