export interface CompletionRequest {
  code: string;
  language: string;
}

export interface CompletionResponse {
  suggestions: string[];
}

const languageTemplates: Record<string, string[]> = {
  javascript: [
    "function solve() {\n  // TODO\n}",
    "const result = items.map(item => item);",
    "if (!value) {\n  return;\n}",
  ],
  typescript: [
    "interface Item {\n  id: string;\n}",
    "const value: string = '';",
    "type Result<T> = { data: T; error?: string };",
  ],
  python: [
    "def solve():\n    pass",
    "for item in items:\n    print(item)",
    "if __name__ == '__main__':\n    main()",
  ],
  java: [
    "public static void main(String[] args) {\n    \n}",
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

export const getCodeCompletions = async ({ code, language }: CompletionRequest): Promise<CompletionResponse> => {
  const normalizedLanguage = language.toLowerCase();
  const templates = languageTemplates[normalizedLanguage] ?? ["// No suggestions available for this language yet."];
  const lastLine = code.split("\n").pop()?.trim() ?? "";

  const ranked = [...templates].sort((a, b) => {
    const aStartsWithLastLine = lastLine.length > 0 && a.toLowerCase().startsWith(lastLine.toLowerCase());
    const bStartsWithLastLine = lastLine.length > 0 && b.toLowerCase().startsWith(lastLine.toLowerCase());

    if (aStartsWithLastLine && !bStartsWithLastLine) return -1;
    if (!aStartsWithLastLine && bStartsWithLastLine) return 1;
    return 0;
  });

  return { suggestions: ranked.slice(0, 3) };
};

export const explainCode = async (code: string, language: string): Promise<string> => {
  const lineCount = code.split("\n").length;
  const languageLabel = language.charAt(0).toUpperCase() + language.slice(1);

  return `${languageLabel} snippet with ${lineCount} line(s). This environment is using a lightweight local explainer.`;
};
