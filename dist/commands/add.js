import path from "node:path";
import { execSync } from "node:child_process";
import fs from "fs-extra";
import chalk from "chalk";
import ora from "ora";
import { requireActiveProject, getProjectConfig, addRepoToProject, reposClonePath, saveRepoIndex, } from "../lib/storage.js";
import { indexRepo } from "../lib/indexer.js";
import { prompt } from "../lib/prompt.js";
import { header, successBox, hint, repoLabel } from "../ui/theme.js";
function isGitUrl(input) {
    return input.startsWith("https://") || input.startsWith("git@") || input.includes("github.com");
}
function repoNameFromUrl(url) {
    const parts = url.replace(/\.git$/, "").split("/");
    return parts[parts.length - 1] || "repo";
}
function repoNameFromPath(p) {
    return path.basename(path.resolve(p));
}
async function addSingleRepo(projectName, repoPathOrUrl) {
    let repoPath;
    let repoName;
    let url;
    if (isGitUrl(repoPathOrUrl)) {
        repoName = repoNameFromUrl(repoPathOrUrl);
        url = repoPathOrUrl;
        const cloneDir = path.join(reposClonePath(), repoName);
        if (await fs.pathExists(cloneDir)) {
            console.log(chalk.dim(`  Repo already cloned, pulling latest...`));
            try {
                execSync(`git -C "${cloneDir}" pull --ff-only`, { stdio: "pipe" });
            }
            catch { }
            repoPath = cloneDir;
        }
        else {
            const spinner = ora(`Cloning ${repoPathOrUrl}`).start();
            await fs.ensureDir(reposClonePath());
            try {
                execSync(`git clone "${repoPathOrUrl}" "${cloneDir}"`, { stdio: "pipe" });
                spinner.succeed(`Cloned ${repoName}`);
            }
            catch (err) {
                spinner.fail(`Failed to clone`);
                console.log(chalk.red(`  ${err instanceof Error ? err.message : err}`));
                return false;
            }
            repoPath = cloneDir;
        }
    }
    else {
        repoPath = path.resolve(repoPathOrUrl);
        repoName = repoNameFromPath(repoPathOrUrl);
        if (!(await fs.pathExists(repoPath))) {
            console.log(chalk.red(`  Path does not exist: ${repoPath}`));
            return false;
        }
    }
    const entry = { name: repoName, path: repoPath, url, addedAt: new Date().toISOString() };
    try {
        await addRepoToProject(projectName, entry);
    }
    catch (err) {
        console.log(chalk.yellow(`  ${err instanceof Error ? err.message : err}`));
        return false;
    }
    const spinner = ora(`Indexing ${repoLabel(repoName)}...`).start();
    try {
        const index = await indexRepo(repoPath, repoName);
        await saveRepoIndex(projectName, index);
        spinner.succeed(`${repoLabel(repoName)} — ${index.fileTree.length} files, ${index.apiRoutes.length} routes, ${index.exports.length} exports`);
        return true;
    }
    catch (err) {
        spinner.fail(`${repoLabel(repoName)} — indexing failed`);
        console.log(chalk.red(`  ${err instanceof Error ? err.message : err}`));
        return true;
    }
}
export async function addCommand(firstRepoPath) {
    console.log(header());
    try {
        const projectName = await requireActiveProject();
        const config = await getProjectConfig(projectName);
        const existingCount = config.repos.length;
        console.log(chalk.bold.cyan("  Add Repositories\n"));
        console.log(chalk.dim(`  Project: ${projectName} | Current repos: ${existingCount}\n`));
        let addedCount = 0;
        // Step 1: add the first repo (from arg or prompt)
        if (firstRepoPath) {
            const ok = await addSingleRepo(projectName, firstRepoPath);
            if (ok)
                addedCount++;
        }
        else {
            console.log(chalk.cyan("  Enter the path or GitHub URL for your first repo:\n"));
            const input = await prompt(chalk.green("  repo 1 > "));
            if (input.trim()) {
                const ok = await addSingleRepo(projectName, input.trim());
                if (ok)
                    addedCount++;
            }
        }
        // Step 2: require at least 2 repos total
        const totalAfterFirst = existingCount + addedCount;
        if (totalAfterFirst < 2) {
            console.log(chalk.cyan("\n  RepoBridge needs at least 2 repos for cross-repo features."));
            console.log(chalk.cyan("  Enter the path or GitHub URL for your second repo:\n"));
            const input = await prompt(chalk.green("  repo 2 > "));
            if (input.trim()) {
                const ok = await addSingleRepo(projectName, input.trim());
                if (ok)
                    addedCount++;
            }
        }
        // Step 3: loop — add more or done
        const totalNow = existingCount + addedCount;
        let repoNumber = totalNow;
        if (totalNow >= 2) {
            while (true) {
                console.log();
                const updatedConfig = await getProjectConfig(projectName);
                console.log(chalk.dim(`  Repos in project: ${updatedConfig.repos.map((r) => r.name).join(", ")}`));
                console.log();
                console.log(chalk.cyan("  What would you like to do?"));
                console.log(`    ${chalk.bold("1)")} Add another repo`);
                console.log(`    ${chalk.bold("2)")} Done — start using RepoBridge\n`);
                const choice = await prompt(chalk.green("  choice (1/2) > "));
                if (choice.trim() === "1") {
                    repoNumber++;
                    const input = await prompt(chalk.green(`  repo ${repoNumber} > `));
                    if (input.trim()) {
                        await addSingleRepo(projectName, input.trim());
                    }
                }
                else {
                    break;
                }
            }
        }
        // Final summary
        const finalConfig = await getProjectConfig(projectName);
        console.log(successBox(`Project: ${chalk.bold(projectName)}\n` +
            `Repos: ${finalConfig.repos.map((r) => r.name).join(", ")}\n` +
            `Total: ${finalConfig.repos.length} repositories`, "Repos Ready"));
        console.log(hint('Next: `ask "your question"` | `plan "feature"` | `status`'));
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(`\nError: ${msg}`));
        process.exit(1);
    }
}
//# sourceMappingURL=add.js.map