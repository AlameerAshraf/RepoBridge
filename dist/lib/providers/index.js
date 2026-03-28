import { DEFAULT_MODELS } from "./base.js";
import { AnthropicProvider } from "./anthropic.js";
import { OpenAIProvider } from "./openai.js";
import { GeminiProvider } from "./gemini.js";
import { OllamaProvider } from "./ollama.js";
export { DEFAULT_MODELS, PROVIDER_ENV_KEYS } from "./base.js";
let cachedProvider = null;
let cachedConfigKey = "";
export function createProvider(config) {
    const key = `${config.provider}:${config.model}:${config.apiKey || ""}:${config.baseUrl || ""}`;
    if (cachedProvider && cachedConfigKey === key)
        return cachedProvider;
    let provider;
    switch (config.provider) {
        case "anthropic":
            provider = new AnthropicProvider(config);
            break;
        case "openai":
            provider = new OpenAIProvider(config);
            break;
        case "gemini":
            provider = new GeminiProvider(config);
            break;
        case "ollama":
            provider = new OllamaProvider(config);
            break;
        default:
            throw new Error(`Unknown provider: ${config.provider}. Supported: anthropic, openai, gemini, ollama`);
    }
    cachedProvider = provider;
    cachedConfigKey = key;
    return provider;
}
export function getDefaultModel(provider) {
    return DEFAULT_MODELS[provider];
}
//# sourceMappingURL=index.js.map