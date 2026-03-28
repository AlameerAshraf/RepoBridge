import type { LLMProvider, ProviderConfig, ProviderName } from "./base.js";
import { DEFAULT_MODELS } from "./base.js";
import { AnthropicProvider } from "./anthropic.js";
import { OpenAIProvider } from "./openai.js";
import { GeminiProvider } from "./gemini.js";
import { OllamaProvider } from "./ollama.js";

export type { LLMProvider, ProviderConfig, ProviderName, ChatMessage } from "./base.js";
export { DEFAULT_MODELS, PROVIDER_ENV_KEYS } from "./base.js";

let cachedProvider: LLMProvider | null = null;
let cachedConfigKey = "";

export function createProvider(config: ProviderConfig): LLMProvider {
  const key = `${config.provider}:${config.model}:${config.apiKey || ""}:${config.baseUrl || ""}`;
  if (cachedProvider && cachedConfigKey === key) return cachedProvider;

  let provider: LLMProvider;
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

export function getDefaultModel(provider: ProviderName): string {
  return DEFAULT_MODELS[provider];
}
