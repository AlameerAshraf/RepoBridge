import readline from "node:readline";

let activeRl: readline.Interface | null = null;

/**
 * Set the shared readline interface (called by the REPL on startup).
 * All commands use this instead of creating their own.
 */
export function setSharedReadline(rl: readline.Interface): void {
  activeRl = rl;
}

/**
 * Clear the shared readline (called on exit).
 */
export function clearSharedReadline(): void {
  activeRl = null;
}

/**
 * Error thrown when the user signals EOF (Ctrl+D) or the input stream closes
 * during a prompt. Commands should catch this to exit gracefully.
 */
export class PromptEOFError extends Error {
  constructor() {
    super("Input closed (EOF)");
    this.name = "PromptEOFError";
  }
}

/**
 * Prompt the user for input. Uses the shared REPL readline if available,
 * otherwise creates a standalone one (for non-REPL usage).
 *
 * Throws PromptEOFError if the input stream closes (Ctrl+D) before
 * the user provides an answer.
 */
export function prompt(question: string): Promise<string> {
  if (activeRl) {
    return new Promise((resolve, reject) => {
      let answered = false;

      const onClose = () => {
        if (!answered) {
          reject(new PromptEOFError());
        }
      };

      activeRl!.once("close", onClose);

      activeRl!.question(question, (answer) => {
        answered = true;
        activeRl?.removeListener("close", onClose);
        resolve(answer);
      });
    });
  }

  // Standalone mode (not inside REPL)
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    let answered = false;

    rl.question(question, (answer) => {
      answered = true;
      rl.close();
      resolve(answer);
    });

    rl.on("close", () => {
      if (!answered) {
        reject(new PromptEOFError());
      }
    });
  });
}
