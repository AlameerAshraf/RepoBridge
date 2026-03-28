import type { LLMProvider, ChatMessage, ProviderConfig } from "./base.js";
export declare class AnthropicProvider implements LLMProvider {
    private client;
    name: string;
    model: string;
    constructor(config: ProviderConfig);
    chat(messages: ChatMessage[], maxTokens?: number): Promise<string>;
    chatStream(messages: ChatMessage[], maxTokens?: number): AsyncGenerator<string, void, undefined>;
    private splitMessages;
}
//# sourceMappingURL=anthropic.d.ts.map