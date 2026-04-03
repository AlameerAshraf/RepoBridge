import chalk from "chalk";
import { requireActiveProject, getAllRepoIndexes, getGlobalConfig, saveSession } from "../lib/storage.js";
import { askStream } from "../lib/ai.js";
import { formatMarkdown } from "../ui/markdown.js";
import { header, hint, errorBox } from "../ui/theme.js";
export async function askCommand(question) {
    console.log(header());
    try {
        const projectName = await requireActiveProject();
        const indexes = await getAllRepoIndexes(projectName);
        if (indexes.length === 0) {
            console.log(chalk.yellow("  No indexed repos. Run `index` first."));
            return;
        }
        console.log(chalk.dim(`  ${projectName} | ${indexes.map((i) => i.repo).join(", ")}`));
        console.log(chalk.bold.white(`\n  Q: ${question}\n`));
        console.log(chalk.dim("  " + "─".repeat(50)));
        // Collect streamed response
        let fullAnswer = "";
        process.stdout.write(chalk.dim("\n  Thinking..."));
        for await (const chunk of askStream(question, indexes)) {
            // Clear "Thinking..." on first chunk
            if (fullAnswer === "") {
                process.stdout.write("\r" + " ".repeat(20) + "\r");
            }
            fullAnswer += chunk;
        }
        // Format and display
        console.log(formatMarkdown(fullAnswer));
        console.log("\n" + chalk.dim("  " + "─".repeat(50)));
        // Save session
        const globalConfig = await getGlobalConfig();
        const session = {
            id: crypto.randomUUID(),
            project: projectName,
            question,
            answer: fullAnswer,
            timestamp: new Date().toISOString(),
            repos: indexes.map((i) => i.repo),
            provider: globalConfig.provider || "anthropic",
            model: globalConfig.model,
        };
        await saveSession(projectName, session);
        console.log(chalk.dim(`  Session saved (${session.id.slice(0, 8)})`));
        console.log(hint('Continue: `ask "follow-up"` | History: `sessions`'));
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(errorBox(msg));
        process.exit(1);
    }
}
//# sourceMappingURL=ask.js.map