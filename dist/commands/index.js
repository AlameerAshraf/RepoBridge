import ora from "ora";
import chalk from "chalk";
import { requireActiveProject, getProjectConfig, saveRepoIndex } from "../lib/storage.js";
import { indexRepo } from "../lib/indexer.js";
import { header, successBox, hint, repoLabel } from "../ui/theme.js";
export async function indexCommand() {
    console.log(header());
    try {
        const projectName = await requireActiveProject();
        const config = await getProjectConfig(projectName);
        if (config.repos.length === 0) {
            console.log(chalk.yellow("  No repos in this project. Add some first."));
            console.log(hint('Run `repobridge add <path-or-url>` to add a repo'));
            return;
        }
        console.log(chalk.bold.cyan(`  Indexing ${config.repos.length} repo(s) in "${projectName}"\n`));
        let totalFiles = 0;
        let totalRoutes = 0;
        let totalExports = 0;
        for (const repo of config.repos) {
            const spinner = ora(`Indexing ${repoLabel(repo.name)}...`).start();
            try {
                const index = await indexRepo(repo.path, repo.name);
                await saveRepoIndex(projectName, index);
                totalFiles += index.fileTree.length;
                totalRoutes += index.apiRoutes.length;
                totalExports += index.exports.length;
                spinner.succeed(`${repoLabel(repo.name)} — ${index.fileTree.length} files, ${index.apiRoutes.length} routes, ${index.exports.length} exports`);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                spinner.fail(`${repoLabel(repo.name)} — ${msg}`);
            }
        }
        console.log(successBox(`Repos indexed: ${config.repos.length}\n` +
            `Total files: ${totalFiles}\n` +
            `Total routes: ${totalRoutes}\n` +
            `Total exports: ${totalExports}`, "Indexing Complete"));
        console.log(hint('Next: `repobridge ask "your question"` or `repobridge plan "feature"`'));
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(`\nError: ${msg}`));
        process.exit(1);
    }
}
//# sourceMappingURL=index.js.map