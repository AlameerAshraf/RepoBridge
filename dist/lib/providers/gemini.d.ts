import type { LLMProvider, ChatMessage, ProviderConfig } from "./base.js";
export declare class GeminiProvider implements LLMProvider {
    private apiKey;
    private baseUrl;
    name: string;
    model: string;
    constructor(config: ProviderConfig);
    chat(messages: ChatMessage[], maxTokens?: number): Promise<string>;
    chatStream(messages: ChatMessage[], maxTokens?: number): AsyncGenerator<string, void, undefined>;
    private formatMessages;
}
//# sourceMappingURL=gemini.d.ts.map