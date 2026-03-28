import chalk from "chalk";
import boxen from "boxen";
import {
  requireActiveProject,
  getAllRepoIndexes,
  saveDebate,
  savePlan,
  listPlans,
  type Plan,
  type DebateConflict,
} from "../lib/storage.js";
import { runDebate } from "../lib/debate.js";
import { prompt } from "../lib/prompt.js";
import {
  header, successBox, hint, repoLabel, getRepoColor,
  conflictSeverityColor, infoBox, errorBox,
  table, truncateStr,
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

export async function debateCommand(feature?: string, existingPlan?: Plan): Promise<void> {
  if (!feature && !existingPlan) {
    console.log(header());
  }

  try {
    const projectName = await requireActiveProject();
    const indexes = await getAllRepoIndexes(projectName);

    if (indexes.length < 2) {
      console.log(chalk.yellow("  Need at least 2 repos to debate. Add more with `add`."));
      return;
    }

    if (!feature) {
      const plans = await listPlans(projectName);
      if (plans.length > 0) {
        feature = plans[0]!.feature;
        existingPlan = plans[0]!;
        console.log(chalk.dim(`  Using latest plan feature: "${feature}"\n`));
      } else {
        feature = await prompt(chalk.cyan("  Feature to debate: "));
      }
    }

    console.log(chalk.bold.cyan("  Debate Mode"));
    console.log(chalk.dim(`  "${feature}"`));
    console.log(chalk.dim(`  Participants: ${indexes.map((i) => i.repo).join(" vs ")}\n`));
    console.log(chalk.dim("  " + "═".repeat(60)));

    const result = await runDebate(feature!, indexes, projectName, {
      onRoundStart(roundNumber) {
        console.log(chalk.bold.cyan(`\n  ROUND ${roundNumber}`));
        console.log(chalk.dim("  " + "─".repeat(60)));
      },

      onMessage(repoName, statement, conflicts) {
        const color = getRepoColor(repoName);
        const label = color.bold(`  ┌─ ${repoName} `);
        const border = color("  │");

        console.log("");
        console.log(label);

        // Statement — wrapped nicely
        const wrapped = wrapText(statement, 56, "  │  ");
        console.log(`${border}  ${chalk.white(wrapped)}`);

        // Conflicts inline
        if (conflicts.length > 0) {
          console.log(`${border}`);
          console.log(`${border}  ${chalk.red.bold(`${conflicts.length} conflict${conflicts.length > 1 ? "s" : ""} found:`)}`);
          for (const c of conflicts) {
            const sev = c.severity === "high" ? chalk.red("HIGH")
              : c.severity === "medium" ? chalk.yellow("MED ")
              : chalk.dim("LOW ");
            console.log(`${border}  ${sev} ${chalk.bold(c.type)}`);
            console.log(`${border}       ${chalk.white(wrapText(c.description, 50, border + "       "))}`);
            console.log(`${border}       ${chalk.dim(`${c.myRef} ↔ ${c.theirRef}`)}`);
          }
        } else {
          console.log(`${border}  ${chalk.green("No conflicts this round")}`);
        }

        console.log(color("  └" + "─".repeat(59)));
      },

      onRoundEnd() {},
      onComplete() {},
    });

    await saveDebate(projectName, result);

    // ─── FINAL REPORT ───
    console.log("\n" + chalk.dim("  " + "═".repeat(60)));

    if (result.conflicts.length === 0) {
      console.log(successBox("No conflicts detected. All repos are aligned.", "Debate Report"));
    } else {
      // Conflict summary table
      const high = result.conflicts.filter((c) => c.severity === "high").length;
      const med = result.conflicts.filter((c) => c.severity === "medium").length;
      const low = result.conflicts.filter((c) => c.severity === "low").length;

      console.log(chalk.bold.cyan("\n  Conflict Report"));
      console.log(chalk.dim(`  ${result.conflicts.length} conflicts found across ${result.rounds.length} rounds\n`));

      // Group by severity
      const groups: Array<[string, DebateConflict[]]> = [
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
          console.log(`     ${chalk.dim("Source:")} ${c.myRef}`);
          console.log(`     ${chalk.dim("Target:")} ${c.theirRef}`);
          console.log("");
          num++;
        }
      }

      // Stats box
      console.log(
        boxen(
          `${chalk.red.bold(String(high))} high   ${chalk.yellow.bold(String(med))} medium   ${chalk.dim(String(low))} low   ${chalk.dim("|")}   ${result.rounds.length} rounds   ${result.conflicts.length} total`,
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

    console.log(hint('Fix conflicts, then re-plan: `plan "feature"`'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(errorBox(msg));
    process.exit(1);
  }
}
