import chalk from "chalk";
import boxen from "boxen";
import stripAnsi from "strip-ansi";
// ─── Layout constants ───
export const INDENT = "  ";
export const DIVIDER = chalk.dim("─".repeat(60));
export const DOUBLE_DIVIDER = chalk.dim("═".repeat(60));
export const ICON = {
    hint: "→",
    success: "✓",
    error: "✗",
    warning: "⚠",
    create: "+",
    modify: "~",
    delete: "-",
    bullet: "•",
};
// ─── Layout helpers ───
export function section(title) {
    return `\n${INDENT}${chalk.bold.cyan(title)}\n${INDENT}${DIVIDER}`;
}
export function subsection(title) {
    return `\n${INDENT}${chalk.bold(title)}`;
}
export function keyValue(key, value) {
    return `${INDENT}${chalk.dim(key + ":")} ${value}`;
}
// ─── Repo colors ───
const REPO_COLORS = [
    chalk.cyan,
    chalk.magenta,
    chalk.yellow,
    chalk.green,
    chalk.blue,
    chalk.red,
    chalk.hex("#FF8C00"),
    chalk.hex("#9B59B6"),
];
const colorMap = new Map();
export function getRepoColor(repoName) {
    if (!colorMap.has(repoName)) {
        const idx = colorMap.size % REPO_COLORS.length;
        colorMap.set(repoName, REPO_COLORS[idx]);
    }
    return colorMap.get(repoName);
}
// ─── Header ───
export function header() {
    const art = chalk.bold.cyan(`
  ╦═╗┌─┐┌─┐┌─┐╔╗ ┬─┐┬┌┬┐┌─┐┌─┐
  ╠╦╝├┤ ├─┘│ │╠╩╗├┬┘│ │││ ┬├┤
  ╩╚═└─┘┴  └─┘╚═╝┴└─┴─┴┘└─┘└─┘
  `) + chalk.dim("  Cross-repo intelligence CLI\n");
    return art;
}
// ─── Boxes ───
export function successBox(message, title) {
    return boxen(chalk.green(message), {
        padding: 1,
        margin: { top: 1, bottom: 1, left: 0, right: 0 },
        borderStyle: "round",
        borderColor: "green",
        title: title ? chalk.bold.green(title) : undefined,
        titleAlignment: "center",
    });
}
export function errorBox(message) {
    return boxen(chalk.red(message), {
        padding: 1,
        margin: { top: 1, bottom: 1, left: 0, right: 0 },
        borderStyle: "round",
        borderColor: "red",
        title: chalk.bold.red("Error"),
        titleAlignment: "center",
    });
}
export function infoBox(message, title) {
    return boxen(chalk.white(message), {
        padding: 1,
        margin: { top: 1, bottom: 1, left: 0, right: 0 },
        borderStyle: "round",
        borderColor: "cyan",
        title: title ? chalk.bold.cyan(title) : undefined,
        titleAlignment: "center",
    });
}
// ─── Inline helpers ───
export function hint(text) {
    return chalk.dim(`\n${ICON.hint} ${text}\n`);
}
export function repoLabel(name) {
    const color = getRepoColor(name);
    return color(`[${name}]`);
}
export function conflictSeverityColor(severity) {
    switch (severity) {
        case "high": return chalk.red.bold("HIGH");
        case "medium": return chalk.yellow.bold("MEDIUM");
        case "low": return chalk.dim("LOW");
        default: return chalk.dim(severity);
    }
}
export function table(headers, rows, options = {}) {
    const maxWidth = options.maxWidth || 120;
    const colWidths = headers.map((h, i) => {
        const maxRow = rows.reduce((max, row) => Math.max(max, stripAnsi(row[i] || "").length), 0);
        return Math.max(stripAnsi(h).length, maxRow) + 2;
    });
    // Shrink columns proportionally if total exceeds maxWidth
    const totalWidth = colWidths.reduce((s, w) => s + w, 0) + (colWidths.length - 1) * 3;
    if (totalWidth > maxWidth) {
        const scale = maxWidth / totalWidth;
        for (let i = 0; i < colWidths.length; i++) {
            colWidths[i] = Math.max(4, Math.floor(colWidths[i] * scale));
        }
    }
    const pad = (str, width) => {
        const visible = stripAnsi(str).length;
        if (visible > width) {
            // Truncate — find the right position accounting for ANSI codes
            return truncateStr(str, width);
        }
        return str + " ".repeat(Math.max(0, width - visible));
    };
    const sep = chalk.dim("│");
    const headerLine = headers.map((h, i) => chalk.bold(pad(h, colWidths[i]))).join(` ${sep} `);
    const divider = colWidths.map((w) => chalk.dim("─".repeat(w))).join(chalk.dim("─┼─"));
    const rowLines = rows.map((row) => row.map((cell, i) => pad(cell, colWidths[i])).join(` ${sep} `));
    const lines = [headerLine, divider];
    if (options.rowSeparators) {
        for (let i = 0; i < rowLines.length; i++) {
            lines.push(rowLines[i]);
            if (i < rowLines.length - 1)
                lines.push(divider);
        }
    }
    else {
        lines.push(...rowLines);
    }
    return lines.join("\n");
}
// ─── Utilities ───
export function truncateStr(str, maxLen) {
    if (stripAnsi(str).length <= maxLen)
        return str;
    // For plain strings, simple slice
    if (str === stripAnsi(str)) {
        return str.slice(0, maxLen - 1) + "…";
    }
    // For ANSI strings, strip and truncate
    const plain = stripAnsi(str);
    return plain.slice(0, maxLen - 1) + "…";
}
//# sourceMappingURL=theme.js.map