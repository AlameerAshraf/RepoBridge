import chalk from "chalk";
export declare const INDENT = "  ";
export declare const DIVIDER: string;
export declare const DOUBLE_DIVIDER: string;
export declare const ICON: {
    readonly hint: "→";
    readonly success: "✓";
    readonly error: "✗";
    readonly warning: "⚠";
    readonly create: "+";
    readonly modify: "~";
    readonly delete: "-";
    readonly bullet: "•";
};
export declare function section(title: string): string;
export declare function subsection(title: string): string;
export declare function keyValue(key: string, value: string): string;
export declare function getRepoColor(repoName: string): typeof chalk;
export declare function header(): string;
export declare function successBox(message: string, title?: string): string;
export declare function errorBox(message: string): string;
export declare function infoBox(message: string, title?: string): string;
export declare function hint(text: string): string;
export declare function repoLabel(name: string): string;
export declare function conflictSeverityColor(severity: string): string;
export interface TableOptions {
    maxWidth?: number;
    rowSeparators?: boolean;
}
export declare function table(headers: string[], rows: string[][], options?: TableOptions): string;
export declare function truncateStr(str: string, maxLen: number): string;
//# sourceMappingURL=theme.d.ts.map