import type { LLMProvider, ChatMessage, ProviderConfig } from "./base.js";
export declare class OllamaProvider implements LLMProvider {
    private baseUrl;
    name: string;
    model: string;
    constructor(config: ProviderConfig);
    chat(messages: ChatMessage[], maxTokens?: number): Promise<string>;
    chatStream(messages: ChatMessage[], maxTokens?: number): AsyncGenerator<string, void, undefined>;
}
//# sourceMappingURL=ollama.d.ts.map