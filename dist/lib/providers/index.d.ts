import type { LLMProvider, ProviderConfig, ProviderName } from "./base.js";
export type { LLMProvider, ProviderConfig, ProviderName, ChatMessage } from "./base.js";
export { DEFAULT_MODELS, PROVIDER_ENV_KEYS } from "./base.js";
export declare function createProvider(config: ProviderConfig): LLMProvider;
export declare function getDefaultModel(provider: ProviderName): string;
//# sourceMappingURL=index.d.ts.map