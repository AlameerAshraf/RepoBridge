import chalk from "chalk";
import boxen from "boxen";
import path from "node:path";
import fs from "fs-extra";
import {
  requireActiveProject,
  getAllRepoIndexes,
  saveDiscussion,
  savePlan,
  listPlans,
  projectPath,
  type Plan,
  type DiscussConflict,
} from "../lib/storage.js";
import { runDiscussion } from "../lib/discuss.js";
import { prompt, PromptEOFError } from "../lib/prompt.js";
import {
  header, successBox, hint, repoLabel, getRepoColor,
  conflictSeverityColor, infoBox, errorBox,
} from "../ui/theme.js";

function wrapText(text: string, width: number, indent: string): string {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.join("\n" + indent);
}

export async function discussCommand(feature?: string, existingPlan?: Plan): Promise<void> {
  if (!feature && !existingPlan) {
    console.log(header());
  }

  try {
    const projectName = await requireActiveProject();
    const indexes = await getAllRepoIndexes(projectName);

    if (indexes.length < 2) {
      console.log(chalk.yellow("  Need at least 2 repos to discuss. Add more with `add`."));
      return;
    }

    if (!feature) {
      const plans = await listPlans(projectName);
      if (plans.length > 0) {
        feature = plans[0]!.feature;
        existingPlan = plans[0]!;
        console.log(chalk.dim(`  Using latest plan feature: "${feature}"\n`));
      } else {
        feature = await prompt(chalk.cyan("  Feature to discuss: "));
      }
    }

    console.log(chalk.bold.cyan("  Discussion Mode"));
    console.log(chalk.dim(`  "${feature}"`));
    console.log(chalk.dim(`  Repos: ${indexes.map((i) => i.repo).join(", ")}\n`));
    console.log(chalk.dim("  " + "═".repeat(60)));

    const result = await runDiscussion(feature!, indexes, projectName, {
      onPhaseStart(phase, steps) {
        const labels: Record<string, string> = {
          "analysis": `Analyzing repos (${steps} repos)`,
          "cross-reference": "Cross-referencing for conflicts",
          "validation": "Validating conflicts",
        };
        console.log(chalk.bold.cyan(`\n  ${labels[phase] || phase}`));
        console.log(chalk.dim("  " + "─".repeat(60)));
      },

      onRepoAnalyzed(repoName, analysis) {
        const color = getRepoColor(repoName);
        const label = color.bold(`  ┌─ ${repoName} — Analysis`);
        const border = color("  │");

        console.log("");
        console.log(label);

        // Show a truncated preview of the analysis
        const previewLines = analysis.split("\n").slice(0, 8);
        for (const line of previewLines) {
          const wrapped = wrapText(line, 56, border + "  ");
          console.log(`${border}  ${chalk.white(wrapped)}`);
        }
        if (analysis.split("\n").length > 8) {
          console.log(`${border}  ${chalk.dim(`... (${analysis.split("\n").length - 8} more lines)`)}`);
        }

        console.log(color("  └" + "─".repeat(59)));
      },

      onConflictsFound(conflicts) {
        if (conflicts.length === 0) {
          console.log(chalk.green("\n  No conflicts detected in cross-reference phase."));
        } else {
          console.log(chalk.yellow(`\n  Found ${conflicts.length} potential conflict${conflicts.length !== 1 ? "s" : ""}. Validating...`));
        }
      },

      onConflictsValidated(conflicts) {
        console.log(chalk.dim(`  Validation complete: ${conflicts.length} conflict${conflicts.length !== 1 ? "s" : ""} confirmed.`));
      },

      onComplete() {},
    });

    await saveDiscussion(projectName, result);

    // Generate markdown report
    const reportPath = path.join(projectPath(projectName), "discussions", `${result.id}-discussion.md`);
    const md = generateDiscussionReport(result, projectName);
    await fs.writeFile(reportPath, md);

    // ─── FINAL REPORT ───
    console.log("\n" + chalk.dim("  " + "═".repeat(60)));

    if (result.conflicts.length === 0) {
      console.log(successBox("No conflicts detected. All repos are aligned.", "Discussion Report"));
    } else {
      const high = result.conflicts.filter((c) => c.severity === "high").length;
      const med = result.conflicts.filter((c) => c.severity === "medium").length;
      const low = result.conflicts.filter((c) => c.severity === "low").length;

      console.log(chalk.bold.cyan("\n  Conflict Report"));
      console.log(chalk.dim(`  ${result.conflicts.length} conflicts found\n`));

      const groups: Array<[string, DiscussConflict[]]> = [
        ["high", result.conflicts.filter((c) => c.severity === "high")],
        ["medium", result.conflicts.filter((c) => c.severity === "medium")],
        ["low", result.conflicts.filter((c) => c.severity === "low")],
      ];

      let num = 1;
      for (const [severity, conflicts] of groups) {
        if (conflicts.length === 0) continue;

        const sevLabel = severity === "high" ? chalk.red.bold("  HIGH SEVERITY")
          : severity === "medium" ? chalk.yellow.bold("  MEDIUM SEVERITY")
          : chalk.dim("  LOW SEVERITY");

        console.log(sevLabel);
        console.log(chalk.dim("  " + "─".repeat(60)));

        for (const c of conflicts) {
          console.log(`  ${chalk.bold(`${num}.`)} ${chalk.bold(c.type)}`);
          console.log(`     ${chalk.white(wrapText(c.description, 55, "     "))}`);
          console.log(`     ${chalk.dim(`${c.repoA}:`)} ${c.repoARef}`);
          console.log(`     ${chalk.dim(`${c.repoB}:`)} ${c.repoBRef}`);
          if (c.severityReason) {
            console.log(`     ${chalk.dim("Why:")} ${chalk.dim(wrapText(c.severityReason, 53, "          "))}`);
          }
          if (c.resolution) {
            console.log(`     ${chalk.green("Fix:")} ${wrapText(c.resolution, 53, "          ")}`);
          }
          console.log("");
          num++;
        }
      }

      // Stats box
      console.log(
        boxen(
          `${chalk.red.bold(String(high))} high   ${chalk.yellow.bold(String(med))} medium   ${chalk.dim(String(low))} low   ${chalk.dim("|")}   ${result.conflicts.length} total`,
          {
            padding: { top: 0, bottom: 0, left: 1, right: 1 },
            margin: { top: 0, bottom: 0, left: 2, right: 0 },
            borderStyle: "round",
            borderColor: high > 0 ? "red" : med > 0 ? "yellow" : "green",
            title: chalk.bold("Summary"),
            titleAlignment: "center",
          }
        )
      );

      if (existingPlan) {
        existingPlan.blockers = result.conflicts;
        await savePlan(projectName, existingPlan);
        console.log(chalk.dim("\n  Conflicts saved as blockers in active plan."));
      }
    }

    console.log(chalk.green(`\n  Report saved: ${reportPath}`));
    console.log(hint('Fix conflicts, then re-plan: `plan "feature"`'));
  } catch (err) {
    if (err instanceof PromptEOFError) {
      console.log(chalk.yellow("\n  Cancelled."));
      return;
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error(errorBox(msg));
    process.exit(1);
  }
}

function generateDiscussionReport(result: import("../lib/storage.js").DiscussResult, projectName: string): string {
  const date = new Date(result.timestamp).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const high = result.conflicts.filter((c) => c.severity === "high").length;
  const med = result.conflicts.filter((c) => c.severity === "medium").length;
  const low = result.conflicts.filter((c) => c.severity === "low").length;

  let md = "";

  md += `# Discussion Report\n\n`;
  md += `> **${result.feature}**\n\n`;
  md += `| | |\n|---|---|\n`;
  md += `| **Project** | ${projectName} |\n`;
  md += `| **Date** | ${date} |\n`;
  md += `| **Repos** | ${result.analyses.map((a) => a.repo).join(", ")} |\n`;
  md += `| **Conflicts** | ${result.conflicts.length} (${high} high, ${med} medium, ${low} low) |\n`;
  md += `\n---\n\n`;

  // Per-repo analyses
  md += `## Repository Analyses\n\n`;
  for (const a of result.analyses) {
    md += `### ${a.repo}\n\n`;
    md += `${a.analysis}\n\n`;
    md += `---\n\n`;
  }

  // Conflicts
  if (result.conflicts.length > 0) {
    md += `## Conflicts\n\n`;

    const groups: Array<[string, string, DiscussConflict[]]> = [
      ["high", "High Severity", result.conflicts.filter((c) => c.severity === "high")],
      ["medium", "Medium Severity", result.conflicts.filter((c) => c.severity === "medium")],
      ["low", "Low Severity", result.conflicts.filter((c) => c.severity === "low")],
    ];

    let num = 1;
    for (const [, label, conflicts] of groups) {
      if (conflicts.length === 0) continue;

      md += `### ${label}\n\n`;
      for (const c of conflicts) {
        md += `**${num}. ${c.type}**\n\n`;
        md += `${c.description}\n\n`;
        md += `- **${c.repoA}:** \`${c.repoARef}\`\n`;
        md += `- **${c.repoB}:** \`${c.repoBRef}\`\n`;
        md += `- **Severity reason:** ${c.severityReason}\n`;
        md += `- **Resolution:** ${c.resolution}\n\n`;
        num++;
      }
    }

    md += `---\n\n`;

    // Action items
    md += `## Action Items\n\n`;
    let actionNum = 1;
    for (const c of result.conflicts) {
      md += `- [ ] **${actionNum}.** [${c.severity.toUpperCase()}] ${c.type}: ${c.resolution}\n`;
      actionNum++;
    }
    md += `\n`;
  } else {
    md += `## Result\n\nNo conflicts detected. All repositories are aligned for this feature.\n\n`;
  }

  md += `---\n\n`;
  md += `*Generated by [RepoBridge](https://github.com/repobridge) on ${date}*\n`;

  return md;
}
