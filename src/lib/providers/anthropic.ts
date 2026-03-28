import Anthropic from "@anthropic-ai/sdk";
import type { LLMProvider, ChatMessage, ProviderConfig } from "./base.js";

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  public name = "Anthropic";
  public model: string;

  constructor(config: ProviderConfig) {
    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY not set. Export it or configure it:\n" +
        "  export ANTHROPIC_API_KEY=sk-ant-...\n" +
        "  repobridge config --provider anthropic --api-key sk-ant-..."
      );
    }
    this.client = new Anthropic({ apiKey });
    this.model = config.model;
  }

  async chat(messages: ChatMessage[], maxTokens = 4096): Promise<string> {
    const { system, userMessages } = this.splitMessages(messages);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system: system || undefined,
      messages: userMessages,
    });

    return response.content[0]?.type === "text" ? response.content[0].text : "";
  }

  async *chatStream(messages: ChatMessage[], maxTokens = 4096): AsyncGenerator<string, void, undefined> {
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

  private splitMessages(messages: ChatMessage[]): {
    system: string | null;
    userMessages: Array<{ role: "user" | "assistant"; content: string }>;
  } {
    let system: string | null = null;
    const userMessages: Array<{ role: "user" | "assistant"; content: string }> = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        system = (system ? system + "\n\n" : "") + msg.content;
      } else {
        userMessages.push({ role: msg.role, content: msg.content });
      }
    }

    return { system, userMessages };
  }
}
