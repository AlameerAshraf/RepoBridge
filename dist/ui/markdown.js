import chalk from "chalk";
import stripAnsi from "strip-ansi";
const MAX_WIDTH = 80;
/**
 * Format a completed markdown string for terminal display.
 * Handles headings (h1-h6), bullets, numbered lists, code blocks,
 * blockquotes, horizontal rules, links, bold, italic, inline code,
 * and repo citations.
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
        const indent = line.length - trimmed.length;
        // Horizontal rules
        if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(trimmed)) {
            out.push(chalk.dim("  " + "─".repeat(60)));
            continue;
        }
        // Headings (h1-h6)
        const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const content = headingMatch[2];
            out.push("");
            if (level <= 2) {
                out.push(chalk.bold.cyan(`  ${content}`));
            }
            else if (level === 3) {
                out.push(chalk.bold(`  ${content}`));
            }
            else {
                // h4-h6: bold with increasing indent
                const extra = "  ".repeat(level - 3);
                out.push(chalk.bold(`  ${extra}${content}`));
            }
            continue;
        }
        // Blockquotes
        if (trimmed.startsWith("> ")) {
            const content = formatInline(trimmed.slice(2));
            const wrapped = wordWrap(content, MAX_WIDTH - 6);
            for (const wl of wrapped.split("\n")) {
                out.push(`  ${chalk.dim("│")} ${wl}`);
            }
            continue;
        }
        if (trimmed === ">") {
            out.push(`  ${chalk.dim("│")}`);
            continue;
        }
        // Markdown table rows
        if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
            // Skip separator rows (|---|---|)
            if (/^\|[\s\-:|]+\|$/.test(trimmed))
                continue;
            const cells = trimmed.slice(1, -1).split("|").map((c) => c.trim());
            const formatted = cells.map((c) => formatInline(c)).join(chalk.dim("  │  "));
            out.push(`  ${formatted}`);
            continue;
        }
        // Bullet points (with nesting support)
        if (/^[-*]\s+/.test(trimmed)) {
            const nestLevel = Math.floor(indent / 2);
            const nestIndent = "  ".repeat(nestLevel);
            const content = formatInline(trimmed.replace(/^[-*]\s+/, ""));
            const wrapped = wordWrap(content, MAX_WIDTH - 6 - nestLevel * 2);
            const wrappedLines = wrapped.split("\n");
            out.push(`  ${nestIndent}${chalk.dim("•")} ${wrappedLines[0]}`);
            for (let i = 1; i < wrappedLines.length; i++) {
                out.push(`  ${nestIndent}  ${wrappedLines[i]}`);
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
    // Links [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => chalk.bold(label) + chalk.dim(` (${url})`));
    // Bold **text**
    text = text.replace(/\*\*([^*]+)\*\*/g, (_, t) => chalk.bold(t));
    // Inline code `text`
    text = text.replace(/`([^`]+)`/g, (_, t) => chalk.yellow(t));
    // Italic *text* (after bold so ** is handled first)
    text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, (_, t) => chalk.italic(t));
    return text;
}
function wordWrap(text, maxWidth) {
    if (stripAnsi(text).length <= maxWidth)
        return text;
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