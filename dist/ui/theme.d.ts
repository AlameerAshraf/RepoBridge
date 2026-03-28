import chalk from "chalk";
export declare function getRepoColor(repoName: string): typeof chalk;
export declare function header(): string;
export declare function successBox(message: string, title?: string): string;
export declare function errorBox(message: string): string;
export declare function infoBox(message: string, title?: string): string;
export declare function hint(text: string): string;
export declare function repoLabel(name: string): string;
export declare function conflictSeverityColor(severity: string): string;
export declare function table(headers: string[], rows: string[][]): string;
export declare function truncateStr(str: string, maxLen: number): string;
//# sourceMappingURL=theme.d.ts.map