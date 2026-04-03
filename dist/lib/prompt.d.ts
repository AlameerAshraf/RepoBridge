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
 * Error thrown when the user signals EOF (Ctrl+D) or the input stream closes
 * during a prompt. Commands should catch this to exit gracefully.
 */
export declare class PromptEOFError extends Error {
    constructor();
}
/**
 * Prompt the user for input. Uses the shared REPL readline if available,
 * otherwise creates a standalone one (for non-REPL usage).
 *
 * Throws PromptEOFError if the input stream closes (Ctrl+D) before
 * the user provides an answer.
 */
export declare function prompt(question: string): Promise<string>;
//# sourceMappingURL=prompt.d.ts.map