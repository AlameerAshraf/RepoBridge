import chalk from "chalk";
import {
  requireActiveProject,
  getProjectConfig,
  getGlobalConfig,
  getRepoIndex,
  listPlans,
  listSessions,
} from "../lib/storage.js";
import { DEFAULT_MODELS, type ProviderName } from "../lib/providers/index.js";
import { header, hint, repoLabel, infoBox } from "../ui/theme.js";

export async function statusCommand(): Promise<void> {
  console.log(header());

  try {
    const projectName = await requireActiveProject();
    const config = await getProjectConfig(projectName);
    const plans = await listPlans(projectName);
    const sessions = await listSessions(projectName);

    console.log(chalk.bold.cyan(`  Project: ${chalk.white(projectName)}\n`));
    const globalConfig = await getGlobalConfig();
    const provider = (globalConfig.provider || "anthropic") as ProviderName;
    const model = globalConfig.model || DEFAULT_MODELS[provider];

    console.log(chalk.dim(`  Created: ${new Date(config.createdAt).toLocaleDateString()}`));
    console.log(chalk.dim(`  Last used: ${new Date(config.lastUsed).toLocaleDateString()}`));
    console.log(chalk.dim(`  AI: ${provider} / ${model}\n`));

    // Repos & index status
    console.log(chalk.bold("  Repositories:"));
    if (config.repos.length === 0) {
      console.log(chalk.yellow("    No repos added yet."));
    } else {
      for (const repo of config.repos) {
        const index = await getRepoIndex(projectName, repo.name);
        const indexStatus = index
          ? chalk.green(`indexed ${new Date(index.indexedAt).toLocaleDateString()} (${index.fileTree.length} files)`)
          : chalk.yellow("not indexed");
        console.log(`    ${repoLabel(repo.name)} ${chalk.dim(repo.path)} — ${indexStatus}`);
      }
    }

    console.log();
    console.log(chalk.dim(`  Plans: ${plans.length} | Sessions: ${sessions.length}`));

    if (plans.length > 0) {
      const latest = plans[0]!;
      console.log(chalk.dim(`  Latest plan: "${latest.feature}" (${new Date(latest.timestamp).toLocaleDateString()})`));
      if (latest.blockers && latest.blockers.length > 0) {
        console.log(chalk.red(`  ⚠ ${latest.blockers.length} unresolved conflicts from debate`));
      }
    }

    console.log(hint('Commands: ask, plan, debate, index, sessions'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(`\nError: ${msg}`));
    process.exit(1);
  }
}
