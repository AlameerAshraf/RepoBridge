export class OpenAIProvider {
    apiKey;
    baseUrl;
    name = "OpenAI";
    model;
    constructor(config) {
        const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("OPENAI_API_KEY not set. Export it or configure it:\n" +
                "  export OPENAI_API_KEY=sk-...\n" +
                "  repobridge config --provider openai --api-key sk-...");
        }
        this.apiKey = apiKey;
        this.baseUrl = config.baseUrl || "https://api.openai.com/v1";
        this.model = config.model;
    }
    async chat(messages, maxTokens = 4096) {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages: messages.map((m) => ({ role: m.role, content: m.content })),
                max_tokens: maxTokens,
            }),
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(`OpenAI API error (${response.status}): ${err}`);
        }
        const data = await response.json();
        return data.choices[0]?.message?.content || "";
    }
    async *chatStream(messages, maxTokens = 4096) {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages: messages.map((m) => ({ role: m.role, content: m.content })),
                max_tokens: maxTokens,
                stream: true,
            }),
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(`OpenAI API error (${response.status}): ${err}`);
        }
        const reader = response.body?.getReader();
        if (!reader)
            throw new Error("No response body");
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith("data: "))
                    continue;
                const data = trimmed.slice(6);
                if (data === "[DONE]")
                    return;
                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices[0]?.delta?.content;
                    if (content)
                        yield content;
                }
                catch { }
            }
        }
    }
}
//# sourceMappingURL=openai.js.map