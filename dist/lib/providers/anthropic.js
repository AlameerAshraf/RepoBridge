import Anthropic from "@anthropic-ai/sdk";
export class AnthropicProvider {
    client;
    name = "Anthropic";
    model;
    constructor(config) {
        const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new Error("ANTHROPIC_API_KEY not set. Export it or configure it:\n" +
                "  export ANTHROPIC_API_KEY=sk-ant-...\n" +
                "  repobridge config --provider anthropic --api-key sk-ant-...");
        }
        this.client = new Anthropic({ apiKey });
        this.model = config.model;
    }
    async chat(messages, maxTokens = 4096) {
        const { system, userMessages } = this.splitMessages(messages);
        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: maxTokens,
            system: system || undefined,
            messages: userMessages,
        });
        return response.content[0]?.type === "text" ? response.content[0].text : "";
    }
    async *chatStream(messages, maxTokens = 4096) {
        const { system, userMessages } = this.splitMessages(messages);
        const stream = this.client.messages.stream({
            model: this.model,
            max_tokens: maxTokens,
            system: system || undefined,
            messages: userMessages,
        });
        for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                yield event.delta.text;
            }
        }
    }
    splitMessages(messages) {
        let system = null;
        const userMessages = [];
        for (const msg of messages) {
            if (msg.role === "system") {
                system = (system ? system + "\n\n" : "") + msg.content;
            }
            else {
                userMessages.push({ role: msg.role, content: msg.content });
            }
        }
        return { system, userMessages };
    }
}
//# sourceMappingURL=anthropic.js.map