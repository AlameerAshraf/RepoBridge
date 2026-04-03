import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import path from "node:path";
import {
  requireActiveProject,
  getAllRepoIndexes,
  savePlan,
  projectPath,
  type Plan,
  type DiscussConflict,
} from "../lib/storage.js";
import { generatePlan } from "../lib/ai.js";
import { header, successBox, hint, repoLabel, infoBox, ICON, INDENT, DIVIDER } from "../ui/theme.js";
import { discussCommand } from "./discuss.js";

export async function planCommand(feature: string, options: { export?: string }): Promise<void> {
  console.log(header());

  try {
    const projectName = await requireActiveProject();
    const indexes = await getAllRepoIndexes(projectName);

    if (indexes.length === 0) {
      console.log(chalk.yellow("  No indexed repos. Run `index` first."));
      return;
    }

    console.log(chalk.dim(`  Feature: "${feature}"\n`));

    const spinner = ora("Generating cross-repo plan...").start();
    const result = await generatePlan(feature, indexes);
    spinner.succeed("Plan generated");

    const plan: Plan = {
      id: crypto.randomUUID(),
      project: projectName,
      feature,
      timestamp: new Date().toISOString(),
      repos: result.repos,
      crossCuttingConcerns: result.crossCuttingConcerns,
    };
    await savePlan(projectName, plan);

    // Render plan per repo
    console.log(chalk.bold.cyan("\n  Implementation Plan\n"));

    for (const repo of result.repos) {
      console.log(`  ${repoLabel(repo.name)}`);
      console.log(`${INDENT}${DIVIDER}`);

      for (let i = 0; i < repo.tasks.length; i++) {
        const t = repo.tasks[i]!;
        const icon = t.action === "create" ? chalk.green(`${ICON.create} CREATE`)
          : t.action === "modify" ? chalk.yellow(`${ICON.modify} MODIFY`)
          : chalk.red(`${ICON.delete} DELETE`);

        console.log(`\n  ${chalk.bold(`${i + 1}.`)} ${icon} ${chalk.bold(t.file)}`);
        console.log(`     ${chalk.white(t.description)}`);

        if (t.details && t.details.length > 0) {
          for (const d of t.details) {
            console.log(`     ${chalk.dim("•")} ${chalk.dim(d)}`);
          }
        }

        if (t.dependencies && t.dependencies.length > 0) {
          console.log(`     ${chalk.dim("deps:")} ${chalk.dim(t.dependencies.join(", "))}`);
        }
      }

      console.log();
    }

    if (result.crossCuttingConcerns.length > 0) {
      console.log(chalk.bold.yellow("  Cross-Cutting Concerns\n"));
      for (let i = 0; i < result.crossCuttingConcerns.length; i++) {
        console.log(chalk.yellow(`  ${i + 1}. ${result.crossCuttingConcerns[i]}`));
      }
      console.log();
    }

    const taskCount = result.repos.reduce((s, r) => s + r.tasks.length, 0);
    console.log(
      infoBox(
        `${result.repos.length} repos | ${taskCount} tasks | ${result.crossCuttingConcerns.length} concerns`,
        "Plan Saved"
      )
    );

    // Generate README
    const readmePath = path.join(projectPath(projectName), "plans", `${plan.id}-plan.md`);
    const md = generateReadme(plan, projectName);
    await fs.writeFile(readmePath, md);
    console.log(chalk.green(`\n  Plan saved: ${readmePath}`));

    console.log(hint('Run discuss to find conflicts: `discuss` | Open plan: `cat ' + readmePath + '`'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(`\nError: ${msg}`));
    process.exit(1);
  }
}

function generateReadme(plan: Plan, projectName: string): string {
  const date = new Date(plan.timestamp).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const taskCount = plan.repos.reduce((s, r) => s + r.tasks.length, 0);
  const blockerCount = plan.blockers?.length || 0;
  const highCount = plan.blockers?.filter((b) => b.severity === "high").length || 0;

  let md = "";

  // Title & badges
  md += `# Implementation Plan\n\n`;
  md += `> **${plan.feature}**\n\n`;
  md += `| | |\n|---|---|\n`;
  md += `| **Project** | ${projectName} |\n`;
  md += `| **Date** | ${date} |\n`;
  md += `| **Repos** | ${plan.repos.length} |\n`;
  md += `| **Tasks** | ${taskCount} |\n`;
  md += `| **Blockers** | ${blockerCount}${highCount > 0 ? ` (${highCount} high)` : ""} |\n`;
  md += `\n---\n\n`;

  // Table of contents
  md += `## Table of Contents\n\n`;
  for (const repo of plan.repos) {
    const anchor = repo.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    md += `- [${repo.name}](#${anchor}) — ${repo.tasks.length} task${repo.tasks.length !== 1 ? "s" : ""}\n`;
  }
  if (plan.crossCuttingConcerns.length > 0) {
    md += `- [Cross-Cutting Concerns](#cross-cutting-concerns)\n`;
  }
  if (blockerCount > 0) {
    md += `- [Blockers](#blockers)\n`;
  }
  md += `- [Checklist](#checklist)\n`;
  md += `\n---\n\n`;

  // Per-repo sections
  for (const repo of plan.repos) {
    md += `## ${repo.name}\n\n`;

    for (let i = 0; i < repo.tasks.length; i++) {
      const t = repo.tasks[i]!;
      const badge = t.action === "create" ? "🟢 CREATE"
        : t.action === "modify" ? "🟡 MODIFY"
        : "🔴 DELETE";

      md += `### ${i + 1}. ${badge} \`${t.file}\`\n\n`;
      md += `${t.description}\n\n`;

      if (t.details && t.details.length > 0) {
        for (const d of t.details) {
          md += `- ${d}\n`;
        }
        md += `\n`;
      }

      if (t.dependencies && t.dependencies.length > 0) {
        md += `> **Depends on:** ${t.dependencies.map((d) => `\`${d}\``).join(", ")}\n\n`;
      }
    }

    md += `---\n\n`;
  }

  // Cross-cutting concerns
  if (plan.crossCuttingConcerns.length > 0) {
    md += `## Cross-Cutting Concerns\n\n`;
    for (const c of plan.crossCuttingConcerns) {
      md += `- ${c}\n`;
    }
    md += `\n---\n\n`;
  }

  // Blockers from discussion
  if (plan.blockers && plan.blockers.length > 0) {
    md += `## Blockers\n\n`;
    md += `> Conflicts identified during cross-repo discussion. Resolve these before implementation.\n\n`;

    const highBlockers = plan.blockers.filter((b) => b.severity === "high");
    const medBlockers = plan.blockers.filter((b) => b.severity === "medium");
    const lowBlockers = plan.blockers.filter((b) => b.severity === "low");

    let num = 1;
    if (highBlockers.length > 0) {
      md += `### High Severity\n\n`;
      for (const b of highBlockers) {
        md += `**${num}. ${b.type}**\n`;
        md += `- ${b.description}\n`;
        md += `- **${b.repoA}:** \`${b.repoARef}\`\n`;
        md += `- **${b.repoB}:** \`${b.repoBRef}\`\n`;
        md += `- **Resolution:** ${b.resolution}\n\n`;
        num++;
      }
    }

    if (medBlockers.length > 0) {
      md += `### Medium Severity\n\n`;
      for (const b of medBlockers) {
        md += `**${num}. ${b.type}**\n`;
        md += `- ${b.description}\n`;
        md += `- **${b.repoA}:** \`${b.repoARef}\`\n`;
        md += `- **${b.repoB}:** \`${b.repoBRef}\`\n`;
        md += `- **Resolution:** ${b.resolution}\n\n`;
        num++;
      }
    }

    if (lowBlockers.length > 0) {
      md += `### Low Severity\n\n`;
      for (const b of lowBlockers) {
        md += `**${num}. ${b.type}**\n`;
        md += `- ${b.description}\n`;
        md += `- **${b.repoA}:** \`${b.repoARef}\`\n`;
        md += `- **${b.repoB}:** \`${b.repoBRef}\`\n`;
        md += `- **Resolution:** ${b.resolution}\n\n`;
        num++;
      }
    }

    md += `---\n\n`;
  }

  // Checklist
  md += `## Checklist\n\n`;
  for (const repo of plan.repos) {
    md += `### ${repo.name}\n\n`;
    for (const t of repo.tasks) {
      md += `- [ ] **${t.action.toUpperCase()}** \`${t.file}\` — ${t.description}\n`;
    }
    md += `\n`;
  }

  if (plan.blockers && plan.blockers.length > 0) {
    md += `### Blockers to Resolve\n\n`;
    for (const b of plan.blockers) {
      md += `- [ ] **${b.type}**: ${b.description}\n`;
    }
    md += `\n`;
  }

  // Footer
  md += `---\n\n`;
  md += `*Generated by [RepoBridge](https://github.com/repobridge) on ${date}*\n`;

  return md;
}
