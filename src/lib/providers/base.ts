export interface ProviderConfig {
  provider: ProviderName;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export type ProviderName = "anthropic" | "openai" | "gemini" | "ollama";

export const DEFAULT_MODELS: Record<ProviderName, string> = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  gemini: "gemini-2.0-flash",
  ollama: "llama3.1",
};

export const PROVIDER_ENV_KEYS: Record<ProviderName, string | null> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  gemini: "GEMINI_API_KEY",
  ollama: null,
};

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMProvider {
  /** Send messages and get a full response */
  chat(messages: ChatMessage[], maxTokens?: number): Promise<string>;

  /** Send messages and stream the response token by token */
  chatStream(messages: ChatMessage[], maxTokens?: number): AsyncGenerator<string, void, undefined>;

  /** Provider display name */
  name: string;

  /** Current model */
  model: string;
}
