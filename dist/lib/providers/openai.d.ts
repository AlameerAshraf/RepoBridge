import type { LLMProvider, ChatMessage, ProviderConfig } from "./base.js";
export declare class OpenAIProvider implements LLMProvider {
    private apiKey;
    private baseUrl;
    name: string;
    model: string;
    constructor(config: ProviderConfig);
    chat(messages: ChatMessage[], maxTokens?: number): Promise<string>;
    chatStream(messages: ChatMessage[], maxTokens?: number): AsyncGenerator<string, void, undefined>;
}
//# sourceMappingURL=openai.d.ts.map