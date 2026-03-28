import { describe, expect, it } from "vitest";
import { DEFAULT_MODELS, PROVIDER_ENV_KEYS, type ProviderName } from "./base.js";

describe("providers/base", () => {
  it("DEFAULT_MODELS has an entry for every provider", () => {
    const names: ProviderName[] = ["anthropic", "openai", "gemini", "ollama"];
    for (const n of names) {
      expect(DEFAULT_MODELS[n]).toBeTruthy();
      expect(typeof DEFAULT_MODELS[n]).toBe("string");
    }
  });

  it("PROVIDER_ENV_KEYS matches providers that need remote keys", () => {
    expect(PROVIDER_ENV_KEYS.anthropic).toBe("ANTHROPIC_API_KEY");
    expect(PROVIDER_ENV_KEYS.openai).toBe("OPENAI_API_KEY");
    expect(PROVIDER_ENV_KEYS.gemini).toBe("GEMINI_API_KEY");
    expect(PROVIDER_ENV_KEYS.ollama).toBeNull();
  });
});
