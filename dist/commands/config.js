import chalk from "chalk";
import { getGlobalConfig, setGlobalConfig } from "../lib/storage.js";
import { DEFAULT_MODELS, PROVIDER_ENV_KEYS, } from "../lib/providers/index.js";
import { header, successBox, hint, infoBox } from "../ui/theme.js";
const VALID_PROVIDERS = ["anthropic", "openai", "gemini", "ollama"];
export async function configCommand(options) {
    console.log(header());
    const config = await getGlobalConfig();
    // Show current config
    if (options.show || (!options.provider && !options.model && !options.apiKey && !options.baseUrl)) {
        const provider = (config.provider || "anthropic");
        const model = config.model || DEFAULT_MODELS[provider];
        const envKey = PROVIDER_ENV_KEYS[provider];
        const hasKey = config.apiKey
            ? "configured (stored)"
            : envKey && process.env[envKey]
                ? `configured (from ${envKey})`
                : chalk.red("not set");
        console.log(infoBox(`Provider:  ${chalk.bold(provider)}\n` +
            `Model:     ${chalk.bold(model)}\n` +
            `API Key:   ${hasKey}\n` +
            `Base URL:  ${config.baseUrl || chalk.dim("default")}`, "Current Configuration"));
        console.log(chalk.dim("\n  Supported providers:"));
        for (const p of VALID_PROVIDERS) {
            const isActive = p === provider ? chalk.green(" (active)") : "";
            const env = PROVIDER_ENV_KEYS[p] ? chalk.dim(` — env: ${PROVIDER_ENV_KEYS[p]}`) : chalk.dim(" — no key needed");
            console.log(`    ${chalk.bold(p)}${isActive} — default model: ${DEFAULT_MODELS[p]}${env}`);
        }
        console.log(hint('Configure: `repobridge config --provider openai --model gpt-4o`'));
        return;
    }
    // Validate provider
    if (options.provider) {
        if (!VALID_PROVIDERS.includes(options.provider)) {
            console.error(chalk.red(`Invalid provider: ${options.provider}`));
            console.error(chalk.dim(`Supported: ${VALID_PROVIDERS.join(", ")}`));
            process.exit(1);
        }
        config.provider = options.provider;
        // Reset to default model for new provider unless model explicitly given
        if (!options.model) {
            config.model = DEFAULT_MODELS[options.provider];
        }
    }
    if (options.model) {
        config.model = options.model;
    }
    if (options.apiKey) {
        config.apiKey = options.apiKey;
    }
    if (options.baseUrl) {
        config.baseUrl = options.baseUrl;
    }
    await setGlobalConfig(config);
    const provider = (config.provider || "anthropic");
    const model = config.model || DEFAULT_MODELS[provider];
    console.log(successBox(`Provider:  ${chalk.bold(provider)}\n` +
        `Model:     ${chalk.bold(model)}\n` +
        `Base URL:  ${config.baseUrl || "default"}`, "Configuration Updated"));
    console.log(hint('Test it: `repobridge ask "hello"`'));
}
//# sourceMappingURL=config.js.map