export class GeminiProvider {
    apiKey;
    baseUrl;
    name = "Gemini";
    model;
    constructor(config) {
        const apiKey = config.apiKey || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY not set. Export it or configure it:\n" +
                "  export GEMINI_API_KEY=...\n" +
                "  repobridge config --provider gemini --api-key ...");
        }
        this.apiKey = apiKey;
        this.baseUrl = config.baseUrl || "https://generativelanguage.googleapis.com/v1beta";
        this.model = config.model;
    }
    async chat(messages, maxTokens = 4096) {
        const { systemInstruction, contents } = this.formatMessages(messages);
        const response = await fetch(`${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                systemInstruction: systemInstruction
                    ? { parts: [{ text: systemInstruction }] }
                    : undefined,
                contents,
                generationConfig: { maxOutputTokens: maxTokens },
            }),
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Gemini API error (${response.status}): ${err}`);
        }
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }
    async *chatStream(messages, maxTokens = 4096) {
        const { systemInstruction, contents } = this.formatMessages(messages);
        const response = await fetch(`${this.baseUrl}/models/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                systemInstruction: systemInstruction
                    ? { parts: [{ text: systemInstruction }] }
                    : undefined,
                contents,
                generationConfig: { maxOutputTokens: maxTokens },
            }),
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Gemini API error (${response.status}): ${err}`);
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
                try {
                    const parsed = JSON.parse(data);
                    const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text)
                        yield text;
                }
                catch { }
            }
        }
    }
    formatMessages(messages) {
        let systemInstruction = null;
        const contents = [];
        for (const msg of messages) {
            if (msg.role === "system") {
                systemInstruction = (systemInstruction ? systemInstruction + "\n\n" : "") + msg.content;
            }
            else {
                contents.push({
                    role: msg.role === "assistant" ? "model" : "user",
                    parts: [{ text: msg.content }],
                });
            }
        }
        return { systemInstruction, contents };
    }
}
//# sourceMappingURL=gemini.js.map