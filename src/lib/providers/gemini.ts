import type { LLMProvider, ChatMessage, ProviderConfig } from "./base.js";

export class GeminiProvider implements LLMProvider {
  private apiKey: string;
  private baseUrl: string;
  public name = "Gemini";
  public model: string;

  constructor(config: ProviderConfig) {
    const apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY not set. Export it or configure it:\n" +
        "  export GEMINI_API_KEY=...\n" +
        "  repobridge config --provider gemini --api-key ..."
      );
    }
    this.apiKey = apiKey;
    this.baseUrl = config.baseUrl || "https://generativelanguage.googleapis.com/v1beta";
    this.model = config.model;
  }

  async chat(messages: ChatMessage[], maxTokens = 4096): Promise<string> {
    const { systemInstruction, contents } = this.formatMessages(messages);

    const response = await fetch(
      `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: systemInstruction
            ? { parts: [{ text: systemInstruction }] }
            : undefined,
          contents,
          generationConfig: { maxOutputTokens: maxTokens },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${err}`);
    }

    const data = await response.json() as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  async *chatStream(messages: ChatMessage[], maxTokens = 4096): AsyncGenerator<string, void, undefined> {
    const { systemInstruction, contents } = this.formatMessages(messages);

    const response = await fetch(
      `${this.baseUrl}/models/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: systemInstruction
            ? { parts: [{ text: systemInstruction }] }
            : undefined,
          contents,
          generationConfig: { maxOutputTokens: maxTokens },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${err}`);
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
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);

        try {
          const parsed = JSON.parse(data) as {
            candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
          };
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) yield text;
        } catch {}
      }
    }
  }

  private formatMessages(messages: ChatMessage[]): {
    systemInstruction: string | null;
    contents: Array<{ role: string; parts: Array<{ text: string }> }>;
  } {
    let systemInstruction: string | null = null;
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        systemInstruction = (systemInstruction ? systemInstruction + "\n\n" : "") + msg.content;
      } else {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    return { systemInstruction, contents };
  }
}
