export interface ProviderConfig {
    provider: ProviderName;
    model: string;
    apiKey?: string;
    baseUrl?: string;
}
export type ProviderName = "anthropic" | "openai" | "gemini" | "ollama";
export declare const DEFAULT_MODELS: Record<ProviderName, string>;
export declare const PROVIDER_ENV_KEYS: Record<ProviderName, string | null>;
export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}
export interface LLMProvider {
    /** Send messages and get a full response */
    chat(messages: ChatMessage[], maxTokens?: number): Promise<string>;
    /** Send messages and stream the response token by token */
    chatStream(messages: ChatMessage[], maxTokens?: number): AsyncGenerator<string, void, undefined>;
    /** Provider display name */
    name: string;
    /** Current model */
    model: string;
}
//# sourceMappingURL=base.d.ts.map