import readline from "node:readline";
/**
 * Set the shared readline interface (called by the REPL on startup).
 * All commands use this instead of creating their own.
 */
export declare function setSharedReadline(rl: readline.Interface): void;
/**
 * Clear the shared readline (called on exit).
 */
export declare function clearSharedReadline(): void;
/**
 * Prompt the user for input. Uses the shared REPL readline if available,
 * otherwise creates a standalone one (for non-REPL usage).
 */
export declare function prompt(question: string): Promise<string>;
//# sourceMappingURL=prompt.d.ts.map