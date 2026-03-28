export class OllamaProvider {
    baseUrl;
    name = "Ollama";
    model;
    constructor(config) {
        this.baseUrl = config.baseUrl || "http://localhost:11434";
        this.model = config.model;
    }
    async chat(messages, maxTokens = 4096) {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: this.model,
                messages: messages.map((m) => ({ role: m.role, content: m.content })),
                stream: false,
                options: { num_predict: maxTokens },
            }),
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Ollama API error (${response.status}): ${err}. Is Ollama running?`);
        }
        const data = await response.json();
        return data.message?.content || "";
    }
    async *chatStream(messages, maxTokens = 4096) {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: this.model,
                messages: messages.map((m) => ({ role: m.role, content: m.content })),
                stream: true,
                options: { num_predict: maxTokens },
            }),
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Ollama API error (${response.status}): ${err}. Is Ollama running?`);
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
                if (!line.trim())
                    continue;
                try {
                    const parsed = JSON.parse(line);
                    if (parsed.message?.content)
                        yield parsed.message.content;
                    if (parsed.done)
                        return;
                }
                catch { }
            }
        }
    }
}
//# sourceMappingURL=ollama.js.map