import type { LLMProvider, ChatMessage, ProviderConfig } from "./base.js";

export class OllamaProvider implements LLMProvider {
  private baseUrl: string;
  public name = "Ollama";
  public model: string;

  constructor(config: ProviderConfig) {
    this.baseUrl = config.baseUrl || "http://localhost:11434";
    this.model = config.model;
  }

  async chat(messages: ChatMessage[], maxTokens = 4096): Promise<string> {
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

    const data = await response.json() as { message: { content: string } };
    return data.message?.content || "";
  }

  async *chatStream(messages: ChatMessage[], maxTokens = 4096): AsyncGenerator<string, void, undefined> {
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
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line) as { message: { content: string }; done: boolean };
          if (parsed.message?.content) yield parsed.message.content;
          if (parsed.done) return;
        } catch {}
      }
    }
  }
}
