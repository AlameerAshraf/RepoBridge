import readline from "node:readline";
let activeRl = null;
/**
 * Set the shared readline interface (called by the REPL on startup).
 * All commands use this instead of creating their own.
 */
export function setSharedReadline(rl) {
    activeRl = rl;
}
/**
 * Clear the shared readline (called on exit).
 */
export function clearSharedReadline() {
    activeRl = null;
}
/**
 * Prompt the user for input. Uses the shared REPL readline if available,
 * otherwise creates a standalone one (for non-REPL usage).
 */
export function prompt(question) {
    if (activeRl) {
        return new Promise((resolve) => {
            activeRl.question(question, (answer) => {
                resolve(answer);
            });
        });
    }
    // Standalone mode (not inside REPL)
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}
//# sourceMappingURL=prompt.js.map