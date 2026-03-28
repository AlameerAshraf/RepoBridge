import chalk from "chalk";
import boxen from "boxen";
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
export function header() {
    const art = chalk.bold.cyan(`
  ╦═╗┌─┐┌─┐┌─┐╔╗ ┬─┐┬┌┬┐┌─┐┌─┐
  ╠╦╝├┤ ├─┘│ │╠╩╗├┬┘│ │││ ┬├┤
  ╩╚═└─┘┴  └─┘╚═╝┴└─┴─┴┘└─┘└─┘
  `) + chalk.dim("  Cross-repo intelligence CLI\n");
    return art;
}
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
export function hint(text) {
    return chalk.dim(`\n💡 ${text}\n`);
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
export function table(headers, rows) {
    const stripAnsi = (str) => str.replace(/\u001b\[[0-9;]*m/g, "");
    const colWidths = headers.map((h, i) => {
        const maxRow = rows.reduce((max, row) => Math.max(max, stripAnsi(row[i] || "").length), 0);
        return Math.max(stripAnsi(h).length, maxRow) + 2;
    });
    const pad = (str, width) => {
        const visible = stripAnsi(str).length;
        return str + " ".repeat(Math.max(0, width - visible));
    };
    const sep = chalk.dim("│");
    const headerLine = headers.map((h, i) => chalk.bold(pad(h, colWidths[i]))).join(` ${sep} `);
    const divider = colWidths.map((w) => chalk.dim("─".repeat(w))).join(chalk.dim("─┼─"));
    const rowLines = rows.map((row) => row.map((cell, i) => pad(cell, colWidths[i])).join(` ${sep} `));
    return [headerLine, divider, ...rowLines].join("\n");
}
export function truncateStr(str, maxLen) {
    if (str.length <= maxLen)
        return str;
    return str.slice(0, maxLen - 1) + "…";
}
//# sourceMappingURL=theme.js.map