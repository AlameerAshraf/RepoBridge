import chalk from "chalk";
const MAX_WIDTH = 80;
/**
 * Format a completed markdown string for terminal display.
 * Handles headings, bullets, code blocks, bold, inline code, and repo citations.
 */
export function formatMarkdown(text) {
    const lines = text.split("\n");
    const out = [];
    let inCodeBlock = false;
    for (const line of lines) {
        // Code block toggle
        if (line.trimStart().startsWith("```")) {
            inCodeBlock = !inCodeBlock;
            if (inCodeBlock) {
                out.push(chalk.dim("  ┌─────────────────────────────────────"));
            }
            else {
                out.push(chalk.dim("  └─────────────────────────────────────"));
            }
            continue;
        }
        if (inCodeBlock) {
            out.push(chalk.cyan(`  │ ${line}`));
            continue;
        }
        const trimmed = line.trimStart();
        // Headings
        if (trimmed.startsWith("### ")) {
            out.push("");
            out.push(chalk.bold(`  ${trimmed.slice(4)}`));
            continue;
        }
        if (trimmed.startsWith("## ")) {
            out.push("");
            out.push(chalk.bold.cyan(`  ${trimmed.slice(3)}`));
            continue;
        }
        if (trimmed.startsWith("# ")) {
            out.push("");
            out.push(chalk.bold.cyan(`  ${trimmed.slice(2)}`));
            continue;
        }
        // Bullet points
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            const content = formatInline(trimmed.slice(2));
            const wrapped = wordWrap(content, MAX_WIDTH - 6);
            const wrappedLines = wrapped.split("\n");
            out.push(`  ${chalk.dim("•")} ${wrappedLines[0]}`);
            for (let i = 1; i < wrappedLines.length; i++) {
                out.push(`    ${wrappedLines[i]}`);
            }
            continue;
        }
        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
            const content = formatInline(numMatch[2]);
            const wrapped = wordWrap(content, MAX_WIDTH - 6);
            const wrappedLines = wrapped.split("\n");
            out.push(`  ${chalk.dim(numMatch[1] + ".")} ${wrappedLines[0]}`);
            for (let i = 1; i < wrappedLines.length; i++) {
                out.push(`     ${wrappedLines[i]}`);
            }
            continue;
        }
        // Empty line
        if (trimmed === "") {
            out.push("");
            continue;
        }
        // Regular paragraph — wrap
        const content = formatInline(trimmed);
        const wrapped = wordWrap(content, MAX_WIDTH - 4);
        for (const wl of wrapped.split("\n")) {
            out.push(`  ${wl}`);
        }
    }
    return out.join("\n");
}
function formatInline(text) {
    // Repo citations [repo:file]
    text = text.replace(/\[([^\]]+?):([^\]]+?)\]/g, (_, repo, file) => chalk.cyan(`[${repo}`) + chalk.dim(`:${file}`) + chalk.cyan(`]`));
    // Bold **text**
    text = text.replace(/\*\*([^*]+)\*\*/g, (_, t) => chalk.bold(t));
    // Inline code `text`
    text = text.replace(/`([^`]+)`/g, (_, t) => chalk.yellow(t));
    // Italic *text* (after bold so ** is handled first)
    text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, (_, t) => chalk.italic(t));
    return text;
}
function wordWrap(text, maxWidth) {
    // Strip ANSI for width calculation
    const stripAnsi = (s) => s.replace(/\u001b\[[0-9;]*m/g, "");
    if (stripAnsi(text).length <= maxWidth)
        return text;
    // Simple word wrap that preserves ANSI codes
    const words = text.split(" ");
    const lines = [];
    let current = "";
    for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (stripAnsi(test).length > maxWidth && current) {
            lines.push(current);
            current = word;
        }
        else {
            current = test;
        }
    }
    if (current)
        lines.push(current);
    return lines.join("\n");
}
//# sourceMappingURL=markdown.js.map