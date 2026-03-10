import axios from "axios";

export interface CompletionRequest {
  code: string;
  language: string;
}

export interface CompletionResponse {
  suggestions: string[];
}

type Provider = "ollama" | "mock";

const provider = ((process.env.CODE_ASSISTANT_PROVIDER || "ollama").toLowerCase() as Provider);
const fallbackEnabled = (process.env.CODE_ASSISTANT_FALLBACK || "true").toLowerCase() === "true";
const ollamaBaseUrl = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/+$/, "");
const ollamaModel = process.env.OLLAMA_MODEL || "qwen2.5-coder:1.5b";
const completionTimeoutMs = Number(process.env.CODE_ASSISTANT_TIMEOUT_MS || 12000);
const maxSuggestions = Number(process.env.CODE_ASSISTANT_MAX_SUGGESTIONS || 3);

const languageTemplates: Record<string, string[]> = {
  javascript: [
    "function solve() {\n  // TODO\n}",
    "const result = items.map((item) => item);",
    "if (!value) {\n  return;\n}",
  ],
  typescript: [
    "interface Item {\n  id: string;\n}",
    "const value: string = \"\";",
    "type Result<T> = { data: T; error?: string };",
  ],
  python: [
    "def solve():\n    pass",
    "for item in items:\n    print(item)",
    "if __name__ == \"__main__\":\n    main()",
  ],
  java: [
    "public static void main(String[] args) {\n\n}",
    "List<Integer> nums = new ArrayList<>();",
    "if (value == null) {\n    return;\n}",
  ],
  cpp: [
    "int main() {\n    return 0;\n}",
    "std::vector<int> nums;",
    "if (value.empty()) {\n    return;\n}",
  ],
  html: [
    "<div class=\"container\">\n  <h1>Hello</h1>\n</div>",
    "<button type=\"button\">Click me</button>",
    "<section>\n  <p>Content</p>\n</section>",
  ],
  react: [
    "const [state, setState] = useState(null);",
    "useEffect(() => {\n  // side-effect\n}, []);",
    "return <div className=\"p-4\">Hello</div>;",
  ],
};

const normalizeLanguage = (language: string): string => {
  const lower = (language || "").toLowerCase();
  if (lower === "ts") return "typescript";
  if (lower === "js") return "javascript";
  return lower;
};

const rankTemplateFallback = (code: string, language: string): string[] => {
  const normalizedLanguage = normalizeLanguage(language);
  const templates = languageTemplates[normalizedLanguage] ?? ["// No suggestions available for this language yet."];
  const lastLine = code.split("\n").pop()?.trim() ?? "";

  return [...templates]
    .sort((a, b) => {
      const aStartsWithLastLine = lastLine.length > 0 && a.toLowerCase().startsWith(lastLine.toLowerCase());
      const bStartsWithLastLine = lastLine.length > 0 && b.toLowerCase().startsWith(lastLine.toLowerCase());

      if (aStartsWithLastLine && !bStartsWithLastLine) return -1;
      if (!aStartsWithLastLine && bStartsWithLastLine) return 1;
      return 0;
    })
    .slice(0, maxSuggestions);
};

const sanitizeSuggestion = (value: string): string => {
  const withoutFence = value
    .replace(/^```[a-zA-Z]*\n?/g, "")
    .replace(/```$/g, "")
    .trim();

  // Remove accidental leading punctuation markers used in lists.
  return withoutFence.replace(/^[-*]\s*/, "").trim();
};

const parseJsonFromText = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const extractSuggestions = (raw: string): string[] => {
  const parsed = parseJsonFromText(raw);
  if (parsed && Array.isArray(parsed.suggestions)) {
    return parsed.suggestions.map((s: string) => sanitizeSuggestion(String(s))).filter(Boolean);
  }

  // Fallback if model ignored JSON format: split by lines.
  return raw
    .split("\n")
    .map((line) => line.replace(/^\d+\.\s*/, ""))
    .map(sanitizeSuggestion)
    .filter(Boolean)
    .slice(0, maxSuggestions);
};

const callOllamaForCompletions = async (code: string, language: string): Promise<string[]> => {
  const normalizedLanguage = normalizeLanguage(language);
  const prompt = [
    "You are a coding assistant that returns inline continuation snippets only.",
    "Return strictly JSON with this shape: {\"suggestions\":[\"...\",\"...\",\"...\"]}.",
    `Language: ${normalizedLanguage}`,
    `Max suggestions: ${maxSuggestions}`,
    "Rules:",
    "- Keep each suggestion short (1-6 lines).",
    "- Do not include markdown or backticks.",
    "- Do not repeat the entire file.",
    "- Suggestions must continue naturally from the existing code.",
    "",
    "Current code:",
    code.slice(-5000),
  ].join("\n");

  const response = await axios.post(
    `${ollamaBaseUrl}/api/generate`,
    {
      model: ollamaModel,
      prompt,
      stream: false,
      format: "json",
      options: {
        temperature: 0.2,
        num_predict: 220,
      },
    },
    {
      timeout: completionTimeoutMs,
      proxy: false,
    }
  );

  const raw = String(response.data?.response || "");
  const suggestions = extractSuggestions(raw).slice(0, maxSuggestions);
  if (suggestions.length === 0) {
    throw new Error("Model returned no suggestions.");
  }
  return suggestions;
};

const callOllamaForExplanation = async (code: string, language: string): Promise<string> => {
  const normalizedLanguage = normalizeLanguage(language);
  const prompt = [
    "You are a concise senior code reviewer.",
    "Explain what this code does in under 120 words.",
    "Mention one improvement suggestion.",
    `Language: ${normalizedLanguage}`,
    "",
    "Code:",
    code.slice(-7000),
  ].join("\n");

  const response = await axios.post(
    `${ollamaBaseUrl}/api/generate`,
    {
      model: ollamaModel,
      prompt,
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: 260,
      },
    },
    {
      timeout: completionTimeoutMs,
      proxy: false,
    }
  );

  return String(response.data?.response || "").trim();
};

export const getCodeCompletions = async ({ code, language }: CompletionRequest): Promise<CompletionResponse> => {
  if (provider === "mock") {
    return { suggestions: rankTemplateFallback(code, language) };
  }

  try {
    const suggestions = await callOllamaForCompletions(code, language);
    return { suggestions };
  } catch (error: any) {
    if (!fallbackEnabled) {
      throw new Error(
        `LLM completion failed (${error?.message || "unknown error"}). ` +
        `Check Ollama at ${ollamaBaseUrl} with model '${ollamaModel}'.`
      );
    }
    return { suggestions: rankTemplateFallback(code, language) };
  }
};

export const explainCode = async (code: string, language: string): Promise<string> => {
  if (provider === "mock") {
    const lineCount = code.split("\n").length;
    const languageLabel = language.charAt(0).toUpperCase() + language.slice(1);
    return `${languageLabel} snippet with ${lineCount} line(s). Switch CODE_ASSISTANT_PROVIDER=ollama for AI explanations.`;
  }

  try {
    return await callOllamaForExplanation(code, language);
  } catch (error: any) {
    if (!fallbackEnabled) {
      throw new Error(
        `LLM explanation failed (${error?.message || "unknown error"}). ` +
        `Check Ollama at ${ollamaBaseUrl} with model '${ollamaModel}'.`
      );
    }
    const lineCount = code.split("\n").length;
    const languageLabel = language.charAt(0).toUpperCase() + language.slice(1);
    return `${languageLabel} snippet with ${lineCount} line(s). LLM unavailable, using fallback explainer.`;
  }
};
